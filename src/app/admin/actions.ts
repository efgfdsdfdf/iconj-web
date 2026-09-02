"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

export async function deleteProduct(productId: string) {
  const { error } = await supabaseAdmin.from("products").delete().eq("id", productId);
  if (error) {
    // 23503 is Foreign Key Violation in Postgres
    if (error.code === "23503") {
      const { data: prod } = await supabaseAdmin.from("products").select("name").eq("id", productId).single();
      const newName = prod ? `[DELETED] ${prod.name}` : `[DELETED] ${productId}`;

      const { error: softErr } = await supabaseAdmin.from("products").update({
        is_active: false,
        approval_status: "rejected",
        name: newName
      }).eq("id", productId);
      if (softErr) return { success: false, error: softErr.message };
    } else {
      return { success: false, error: error.message };
    }
  }
  revalidatePath("/admin/products");
  revalidatePath("/shop");
  return { success: true };
}

export async function updateProduct(productId: string, data: any) {
  const { error } = await supabaseAdmin.from("products").update(data).eq("id", productId);
  if (error) return { success: false, error: error.message };
  // revalidatePath("/admin/products");
  // revalidatePath("/shop");
  // revalidatePath(`/shop/${productId}`);
  return { success: true };
}


export async function createProduct(data: any) {
  try {
    // Auto-generate unique sequential Product ID
    const category = data.category || "PROD";
    const firstWord = category.split(/[^a-zA-Z]/).find((w: string) => w.length > 0) || "PROD";
    let prefix = firstWord.toUpperCase().substring(0, 6);
    if (prefix === "MATERN") prefix = "MOM"; // map Maternity to MOM for clean IDs

    const { data: existing } = await supabaseAdmin
      .from("products")
      .select("sku")
      .like("sku", `ICONJ-${prefix}-%`);

    let maxNum = 0;
    if (existing) {
      existing.forEach((p: any) => {
        const match = p.sku?.match(/(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) maxNum = num;
        }
      });
    }
    
    data.sku = `ICONJ-${prefix}-${String(maxNum + 1).padStart(3, '0')}`;

    const { error } = await supabaseAdmin.from("products").insert([data]);
    if (error) return { success: false, error: error.message };
    // revalidatePath("/admin/products");
    // revalidatePath("/shop");
    return { success: true };
  } catch (err: any) {
    console.error("Create product error:", err);
    return { success: false, error: err.message || "Failed to create product" };
  }
}


export async function uploadProductImage(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    if (!file) throw new Error("No file provided");
    
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const { error } = await supabaseAdmin.storage.from("product-images").upload(fileName, buffer, {
      contentType: file.type || "image/jpeg"
    });
    
    if (error) throw new Error(error.message);
    
    const { data } = supabaseAdmin.storage.from("product-images").getPublicUrl(fileName);
    return { success: true, url: data.publicUrl };
  } catch (err: any) {
    console.error("Upload error:", err);
    return { success: false, error: err.message || "Failed to upload image" };
  }
}

export async function uploadProductImageBase64(base64Str: string, originalName: string, contentType: string) {
  try {
    const fileExt = originalName.split(".").pop() || "jpg";
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    
    // Convert base64 to buffer
    const base64Data = base64Str.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    
    const { error } = await supabaseAdmin.storage.from("product-images").upload(fileName, buffer, {
      contentType: contentType || "image/jpeg"
    });
    
    if (error) throw new Error(error.message);
    
    const { data } = supabaseAdmin.storage.from("product-images").getPublicUrl(fileName);
    return { success: true, url: data.publicUrl };
  } catch (err: any) {
    console.error("Upload base64 error:", err);
    return { success: false, error: err.message || "Failed to upload image" };
  }
}

export async function addReview(productId: string, review: { name: string, comment: string, rating: number }) {
  try {
    const { data: product, error: fetchErr } = await supabaseAdmin.from('products').select('variants').eq('id', productId).single();
    if (fetchErr) throw fetchErr;

    const currentVariants = product.variants || {};
    const existingReviews = currentVariants.__reviews || [];
    
    const newReview = {
      ...review,
      date: new Date().toISOString(),
      verified: false
    };

    const updatedVariants = {
      ...currentVariants,
      __reviews: [newReview, ...existingReviews]
    };

    const { error: updateErr } = await supabaseAdmin.from('products').update({ variants: updatedVariants }).eq('id', productId);
    if (updateErr) throw updateErr;

    revalidatePath(`/shop/${productId}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to add review' };
  }
}


export async function updateIssue(issueId: string, data: { status: string, admin_notes: string }, sendEmail: boolean = false) {
  try {
    const { error } = await supabaseAdmin.from("order_issues").update(data).eq("id", issueId);
    if (error) throw error;

    if (sendEmail && data.admin_notes) {
      try {
        const { data: issue } = await supabaseAdmin
          .from("order_issues")
          .select("*, profiles(name, email)")
          .eq("id", issueId)
          .single();

        if (issue?.profiles?.email) {
          const { sendEmailTo } = await import("@/lib/email");
          const shortOrder = issue.order_id?.substring(0, 8).toUpperCase();
          await sendEmailTo(
            issue.profiles.email,
            `Update on your ICONJ Order Issue (Order #${shortOrder})`,
            `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 24px; border-radius: 12px;">
              <div style="background: #1e3a5f; padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 22px;">Order Issue Update</h1>
              </div>
              <div style="background: white; padding: 28px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0; border-top: none;">
                <p style="color: #475569; margin: 0 0 16px;">Hi ${issue.profiles.name || 'Valued Customer'},</p>
                <p style="color: #475569; margin: 0 0 20px;">We have an update regarding your reported issue for Order <strong>#${shortOrder}</strong>.</p>
                
                <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; border-radius: 4px; margin: 0 0 20px;">
                  <p style="font-size: 12px; text-transform: uppercase; color: #10b981; font-weight: bold; margin: 0 0 8px;">New Status</p>
                  <p style="font-size: 16px; font-weight: bold; color: #0f172a; margin: 0;">${data.status}</p>
                </div>

                <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 4px; margin: 0 0 24px;">
                  <p style="font-size: 12px; text-transform: uppercase; color: #64748b; font-weight: bold; margin: 0 0 8px;">Message from ICONJ Support</p>
                  <p style="color: #0f172a; margin: 0; line-height: 1.6;">${data.admin_notes}</p>
                </div>

                <div style="text-align: center;">
                  <a href="https://iconj.com.ng/account/issues" style="display: inline-block; background: #1e3a5f; color: white; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold;">View Issue Details</a>
                </div>
              </div>
            </div>
            `
          );
        }
      } catch (emailErr) {
        console.error("Failed to send issue update email:", emailErr);
      }
    }

    revalidatePath("/admin/issues");
    revalidatePath(`/admin/issues/${issueId}`);
    revalidatePath("/account/issues");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update issue" };
  }
}


export async function updateCategories(categories: { name: string, icon: string }[]) {
  try {
    const { error } = await supabaseAdmin
      .from("store_settings")
      .upsert({ id: "homepage_categories", value: categories, updated_at: new Date().toISOString() });
      
    if (error) throw error;
    revalidatePath("/");
    revalidatePath("/admin/categories");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update categories" };
  }
}

export async function getSuppliers() {
  const { data } = await supabaseAdmin.from('suppliers').select('id, name');
  return data || [];
}
