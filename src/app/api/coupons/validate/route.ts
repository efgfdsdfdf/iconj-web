import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { code, subtotal } = await req.json();

    if (!code || !subtotal) {
      return NextResponse.json({ valid: false, error: "Missing coupon code or subtotal" }, { status: 400 });
    }

    // Find coupon (case-insensitive)
    const { data: coupon, error } = await supabaseAdmin
      .from("coupons")
      .select("*")
      .ilike("code", code.trim())
      .eq("is_active", true)
      .single();

    if (error || !coupon) {
      return NextResponse.json({ valid: false, error: "Invalid or expired coupon code." });
    }

    const now = new Date();

    // Check date validity
    if (coupon.start_date && new Date(coupon.start_date) > now) {
      return NextResponse.json({ valid: false, error: "This coupon isn't active yet." });
    }
    if (coupon.end_date && new Date(coupon.end_date) < now) {
      return NextResponse.json({ valid: false, error: "This coupon has expired." });
    }

    // Check usage limit
    if (coupon.usage_limit !== null && coupon.times_used >= coupon.usage_limit) {
      return NextResponse.json({ valid: false, error: "This coupon has reached its usage limit." });
    }

    // Check minimum order amount
    if (coupon.min_order_amount && subtotal < Number(coupon.min_order_amount)) {
      return NextResponse.json({
        valid: false,
        error: `Minimum order of ₦${Number(coupon.min_order_amount).toLocaleString()} required for this coupon.`
      });
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discount_type === "percentage") {
      discountAmount = (subtotal * Number(coupon.discount_value)) / 100;
      // Apply max cap if set
      if (coupon.max_discount_amount) {
        discountAmount = Math.min(discountAmount, Number(coupon.max_discount_amount));
      }
    } else if (coupon.discount_type === "fixed_amount") {
      discountAmount = Math.min(Number(coupon.discount_value), subtotal);
    } else if (coupon.discount_type === "free_shipping") {
      discountAmount = 0; // Handled at shipping level on the frontend
    }

    discountAmount = Math.round(discountAmount);

    return NextResponse.json({
      valid: true,
      coupon_id: coupon.id,
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      discount_amount: discountAmount,
      description: coupon.description,
    });

  } catch (err: any) {
    console.error("[Coupon Validate]", err);
    return NextResponse.json({ valid: false, error: "Failed to validate coupon." }, { status: 500 });
  }
}
