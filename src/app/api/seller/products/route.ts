import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify the user is an approved seller
  const { data: seller } = await supabase
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

  const body = await req.json();
  const { name, sku, selling_price, description, stock_status, category_id, category, images } = body;

  if (!name || !sku || !selling_price) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const bType = (seller as any).businesses?.business_type;
  const isRetail = (bType === "retail" || bType === "manufacturer");
  const isWholesale = (bType === "wholesale" || bType === "manufacturer");

  // Use the server-side supabase which has proper permissions
  const { createClient: createAdminClient } = require("@supabase/supabase-js");
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabaseAdmin.from("products").insert({
    seller_id: seller.id,
    name,
    sku,
    base_selling_price: parseFloat(selling_price),
    base_supplier_cost: 0,
    description: description || "",
    stock_status: stock_status || "In Stock",
    category_id: category_id || null,
    category: category || "",
    images: images || [],
    approval_status: "pending",
    is_retail_enabled: isRetail,
    is_wholesale_enabled: isWholesale,
  }).select().single();

  if (error) {
    console.error("Product insert error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ product: data });
}
