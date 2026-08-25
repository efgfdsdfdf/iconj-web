"use server";

import { createClient } from "@supabase/supabase-js";

export async function verifyPaymentAndCompleteOrder(reference: string) {
  try {
    const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    });
    
    const paystackData = await paystackRes.json();
    if (!paystackData.status || paystackData.data.status !== "success") {
      return { success: false, message: "Payment verification failed" };
    }

    const orderId = paystackData.data.metadata?.order_id || paystackData.data.reference || reference;
    
    if (!orderId) {
      return { success: false, message: "Order ID not found in transaction metadata" };
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!, 
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Update main order
    await supabaseAdmin.from("orders").update({
      payment_status: "PAID",
      order_status: "PAYMENT_CONFIRMED", 
      paystack_reference: reference,
      admin_viewed: false // Important for admin notifications
    }).eq("id", orderId);

    // Update suborders
    await supabaseAdmin.from("seller_orders").update({
      status: "PROCESSING"
    }).eq("parent_order_id", orderId);

    // Update payment record
    await supabaseAdmin.from("payments").update({
      status: "SUCCESS"
    }).eq("order_id", orderId);

    // Add timeline event
    await supabaseAdmin.from('order_events').insert({
      order_id: orderId,
      event_type: 'PAYMENT_CONFIRMED',
      description: `Payment confirmed (Ref: ${reference}).`
    });

    return { success: true, orderId };
  } catch (error: any) {
    console.error("Verification error:", error);
    return { success: false, message: error.message };
  }
}
