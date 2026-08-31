import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    let { enable_custom_measurements, motorization_fee, installation_fee, ...data } = await req.json();

    const { error } = await supabaseAdmin.from("products").update(data).eq("id", id);
    if (!error) {
      if (enable_custom_measurements) {
        await supabaseAdmin.from("product_configuration_rules").upsert({
          product_id: id,
          pricing_model: "per_sqm",
          min_width_cm: 30,
          max_width_cm: 300,
          min_height_cm: 30,
          max_height_cm: 300,
          motorization_available: true,
          motorization_fee: Number(motorization_fee) || 50000,
          installation_available: true,
          base_installation_fee: Number(installation_fee) || 5000
        }, { onConflict: 'product_id' });
      } else {
        await supabaseAdmin.from("product_configuration_rules").delete().eq("product_id", id);
      }
    }
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 400 });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Update product error:", err);
    return NextResponse.json({ success: false, error: err.message || "Failed to update product" }, { status: 500 });
  }
}
