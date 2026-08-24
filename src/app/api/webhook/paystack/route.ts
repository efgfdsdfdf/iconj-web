import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const bodyText = await req.text();
    const signature = req.headers.get("x-paystack-signature");
    const secret = process.env.PAYSTACK_SECRET_KEY || "";

    // Verify webhook signature
    const hash = crypto.createHmac("sha512", secret).update(bodyText).digest("hex");
    if (hash !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(bodyText);
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    if (event.event === "charge.success") {
      const data = event.data;
      const orderId = data.metadata?.order_id || data.reference;

      // 1. Log the event
      const { data: paymentRecord } = await supabaseAdmin
        .from("payments")
        .select("id")
        .eq("order_id", orderId)
        .single();

      if (paymentRecord) {
        await supabaseAdmin.from("payment_events").insert([{
          payment_id: paymentRecord.id,
          event_type: event.event,
          payload: event
        }]);

        // 2. Update payment status
        await supabaseAdmin.from("payments").update({
          status: "SUCCESS",
          verification_result: { ...data }
        }).eq("id", paymentRecord.id);
      }

      // 3. Update Parent Order
      await supabaseAdmin.from("orders").update({
        payment_status: "PAID",
        order_status: "PROCESSING" // Moved past PENDING_PAYMENT
      }).eq("id", orderId);

      // 4. Update Sub-orders (Seller Orders) and Commissions
      await supabaseAdmin.from("seller_orders").update({
        status: "PROCESSING"
      }).eq("parent_order_id", orderId);

      // Optionally, you could notify the sellers here using the notifications table
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: "Webhook Error" }, { status: 500 });
  }
}
