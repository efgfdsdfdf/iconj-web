import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendAdminNotification } from "@/lib/email"; // Assume this exists based on old code

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.redirect(new URL('/shop', request.url));
    }

    // Verify transaction with Paystack
    const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
      }
    });

    const verifyData = await verifyResponse.json();

    if (verifyData.status && verifyData.data.status === 'success') {
      const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
      
      const orderId = verifyData.data.metadata?.order_id;
      if (!orderId) throw new Error("No order ID found in Paystack metadata");

      // 1. Fetch order to ensure idempotency (don't process if already PAID)
      const { data: order } = await supabaseAdmin.from("orders").select("payment_status").eq("id", orderId).single();
      
      if (order && order.payment_status !== 'PAID') {
        // 2. Update the order status to PAID and order_status to PAYMENT_CONFIRMED
        const { error } = await supabaseAdmin
          .from('orders')
          .update({
            payment_status: 'PAID',
            order_status: 'PAYMENT_CONFIRMED',
            admin_viewed: false // explicitly reset viewing so it bumps to Needs Attention
          })
          .eq('id', orderId);

        if (error) {
          console.error("Supabase Error updating order:", error);
        } else {
          // 3. Add to order timeline
          await supabaseAdmin.from('order_events').insert({
            order_id: orderId,
            event_type: 'PAYMENT_CONFIRMED',
            description: `Payment confirmed via Paystack (Ref: ${reference}).`
          });

          // 4. Create internal admin notification
          await supabaseAdmin.from('admin_notifications').insert({
            type: 'NEW_PAID_ORDER',
            message: `New paid order #${orderId.split("-")[0].toUpperCase()} requires processing.`,
            order_id: orderId
          });

          // Send Email fallback
          try {
            await sendAdminNotification(
              `New Paid Order #${orderId.split("-")[0].toUpperCase()}`,
              `A new order has been paid and is waiting for you in the dashboard.`
            );
          } catch (e) {
            console.warn("Failed to send email fallback", e);
          }
        }
      }

      return NextResponse.redirect(new URL(`/checkout/success?order=${orderId}`, request.url));
    } else {
      // Transaction failed
      return NextResponse.redirect(new URL('/checkout?error=payment_failed', request.url));
    }
  } catch (error) {
    console.error("Callback error:", error);
    return NextResponse.redirect(new URL('/checkout?error=server_error', request.url));
  }
}
