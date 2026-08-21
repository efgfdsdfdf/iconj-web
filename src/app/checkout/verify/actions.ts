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

    const customFields = paystackData.data.metadata?.custom_fields || [];
    const orderIdField = customFields.find((f: any) => f.variable_name === "order_id");
    
    if (!orderIdField || !orderIdField.value) {
      return { success: false, message: "Order ID not found in transaction metadata" };
    }

    const orderId = orderIdField.value;

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!, 
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    await supabaseAdmin.from("orders").update({
      payment_status: "paid",
      order_status: "processing", // Or whatever the next step is
      paystack_reference: reference
    }).eq("id", orderId);

    return { success: true, orderId };
  } catch (error: any) {
    console.error("Verification error:", error);
    return { success: false, message: error.message };
  }
}
