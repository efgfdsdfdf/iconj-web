import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Use admin client for DB operations
  const { createClient: createAdminClient } = require("@supabase/supabase-js");
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Verify the user is an approved seller
  const { data: seller } = await supabaseAdmin
    .from("sellers")
    .select("id, businesses(business_type)")
    .eq("profile_id", user.id)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!seller) {
    return NextResponse.json({ error: "Not an approved seller" }, { status: 403 });
  }

  // Verify product belongs to seller
  const { data: existingProduct } = await supabaseAdmin
    .from("products")
    .select("id, approval_status")
    .eq("id", id)
    .eq("seller_id", seller.id)
    .single();

  if (!existingProduct) {
    return NextResponse.json({ error: "Product not found or unauthorized" }, { status: 404 });
  }

  const body = await req.json();
  const {
    name, sku, selling_price, description, stock_status,
    category_id, category, images,
    moq, pricing_tiers, brand, features, weight_kg
  } = body;

  const bType = (seller as any).businesses?.business_type;
  const isRetail = (bType === "retail" || bType === "manufacturer");
  const isWholesale = (bType === "wholesale" || bType === "manufacturer");

  // Keep existing approval status unless it was rejected, then move to pending
  const newApprovalStatus = existingProduct.approval_status === "rejected" ? "pending" : existingProduct.approval_status;

  const { data, error } = await supabaseAdmin.from("products").update({
    name,
    sku,
    base_selling_price: parseFloat(selling_price),
    description: description || "",
    stock_status: stock_status || "In Stock",
    category_id: category_id || null,
    category: category || "",
    images: images || [],
    approval_status: newApprovalStatus,
    is_retail_enabled: isRetail,
    is_wholesale_enabled: isWholesale,
    moq: moq ? parseInt(moq) : 1,
    brand: brand || null,
    features: features || [],
    weight_kg: weight_kg ? parseFloat(weight_kg) : null,
  }).eq("id", id).select().single();

  if (error) {
    console.error("Product update error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Update wholesale pricing tiers
  // First, delete old tiers
  await supabaseAdmin.from("wholesale_pricing").delete().eq("product_id", id);

  if (pricing_tiers && pricing_tiers.length > 0 && data) {
    const tierRows = pricing_tiers
      .filter((t: any) => t.min_quantity && t.price_per_unit)
      .map((t: any) => ({
        product_id: data.id,
        min_quantity: parseInt(t.min_quantity),
        max_quantity: t.max_quantity ? parseInt(t.max_quantity) : null,
        price_per_unit: parseFloat(t.price_per_unit),
      }));

    if (tierRows.length > 0) {
      await supabaseAdmin.from("wholesale_pricing").insert(tierRows);
    }
  }

  // Update or insert stock quantity
  if (body.stock_quantity !== undefined && body.stock_quantity !== null && data) {
    const { data: invData } = await supabaseAdmin.from("inventory").select("id").eq("product_id", data.id).single();
    if (invData) {
      await supabaseAdmin.from("inventory").update({ available_quantity: parseInt(body.stock_quantity) }).eq("id", invData.id);
    } else {
      await supabaseAdmin.from("inventory").insert({
        product_id: data.id,
        available_quantity: parseInt(body.stock_quantity),
        reserved_quantity: 0
      });
    }
  }

  return NextResponse.json({ product: data });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { createClient: createAdminClient } = require("@supabase/supabase-js");
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: seller } = await supabaseAdmin
    .from("sellers")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  if (!seller) return NextResponse.json({ error: "Not a seller" }, { status: 403 });

  const { error } = await supabaseAdmin.from("products").delete().eq("id", id).eq("seller_id", seller.id);

  if (error) {
    if (error.code === "23503") {
      const { error: softErr } = await supabaseAdmin.from("products").update({
        is_active: false,
        approval_status: "deleted"
      }).eq("id", id).eq("seller_id", seller.id);
      
      if (softErr) {
        return NextResponse.json({ error: softErr.message }, { status: 500 });
      }
    } else {
      console.error("Delete error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
