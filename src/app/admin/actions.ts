"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

export async function deleteProduct(productId: string) {
  const { error } = await supabaseAdmin.from("products").delete().eq("id", productId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/products");
  revalidatePath("/shop");
  return { success: true };
}

export async function updateProduct(productId: string, data: any) {
  const { error } = await supabaseAdmin.from("products").update(data).eq("id", productId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/products");
  revalidatePath("/shop");
  revalidatePath(`/shop/${productId}`);
  return { success: true };
}


export async function createProduct(data: any) {
  try {
    const { error } = await supabaseAdmin.from("products").insert([data]);
    if (error) throw new Error(error.message);
    revalidatePath("/admin/products");
    revalidatePath("/shop");
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
    // Return a plain object instead of throwing to avoid Next.js serialization errors (Error 441)
    return { success: false, error: err.message || "Failed to upload image" };
  }
}

