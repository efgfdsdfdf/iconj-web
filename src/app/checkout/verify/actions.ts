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

    // Sync financial ledger for admin payouts page
    const { data: sellerOrders } = await supabaseAdmin.from("seller_orders").select("id, seller_id").eq("parent_order_id", orderId);
    if (sellerOrders && sellerOrders.length > 0) {
      const sellerOrderIds = sellerOrders.map(so => so.id);
      const { data: commissions } = await supabaseAdmin.from("commissions").select("*").in("seller_order_id", sellerOrderIds);
      
      if (commissions && commissions.length > 0) {
        // Idempotency check: Don't insert if webhook already did it
        const { data: existingLedger } = await supabaseAdmin.from('financial_ledger').select('id').eq('paystack_reference', reference).limit(1);
        
        if (!existingLedger || existingLedger.length === 0) {
          const ledgerEntries = [];
          for (const comm of commissions) {
            ledgerEntries.push({
              seller_id: comm.seller_id,
              order_id: orderId,
              paystack_reference: reference,
              transaction_type: 'SALE_GROSS',
              amount: comm.gross_amount,
              description: 'Customer payment received'
            });
            ledgerEntries.push({
              seller_id: comm.seller_id,
              order_id: orderId,
              paystack_reference: reference,
              transaction_type: 'ICONJ_COMMISSION',
              amount: -comm.commission_amount,
              description: 'ICONJ platform fee deduction'
            });
            ledgerEntries.push({
              seller_id: comm.seller_id,
              order_id: orderId,
              paystack_reference: reference,
              transaction_type: 'SETTLEMENT_PENDING',
              amount: comm.seller_net_amount,
              description: 'Funds pending settlement to payout account'
            });
          }
          await supabaseAdmin.from("financial_ledger").insert(ledgerEntries);
          // Also mark commissions as AVAILABLE
          await supabaseAdmin.from("commissions").update({ status: 'AVAILABLE' }).in('id', commissions.map(c => c.id));
        }
      }
    }

    return { success: true, orderId };
  } catch (error: any) {
    console.error("Verification error:", error);
    return { success: false, message: error.message };
  }
}
