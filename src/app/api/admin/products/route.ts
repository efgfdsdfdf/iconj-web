import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    let { enable_custom_measurements, ...data } = await req.json();

    // Auto-generate SKU
    const category = data.category || "PROD";
    const firstWord = category.split(/[^a-zA-Z]/).find((w: string) => w.length > 0) || "PROD";
    let prefix = firstWord.toUpperCase().substring(0, 6);
    if (prefix === "MATERN") prefix = "MOM";

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

    data.sku = `ICONJ-${prefix}-${String(maxNum + 1).padStart(3, "0")}`;

    const { data: newProduct, error } = await supabaseAdmin.from("products").insert([data]).select().single();
    if (newProduct && enable_custom_measurements) {
      await supabaseAdmin.from("product_configuration_rules").insert([{
        product_id: newProduct.id,
        pricing_model: "per_sqm",
        min_width_cm: 30,
        max_width_cm: 300,
        min_height_cm: 30,
        max_height_cm: 300,
        motorization_available: true,
        motorization_fee: 15000,
        installation_available: true,
        base_installation_fee: 5000
      }]);
    }
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 400 });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Create product error:", err);
    return NextResponse.json({ success: false, error: err.message || "Failed to create product" }, { status: 500 });
  }
}
