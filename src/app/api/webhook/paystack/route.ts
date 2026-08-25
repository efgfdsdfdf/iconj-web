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

    // Handle Charge Success (Customer Paid Platform)
    if (event.event === "charge.success") {
      const data = event.data;
      const orderId = data.metadata?.order_id || data.reference;

      // 1. Idempotency Check: Did we already process this exact charge?
      const { data: existingLedger } = await supabaseAdmin
        .from('financial_ledger')
        .select('id')
        .eq('paystack_reference', data.reference)
        .eq('transaction_type', 'SALE_GROSS')
        .limit(1)
        .single();
        
      if (existingLedger) {
        return NextResponse.json({ received: true, message: "Duplicate charge.success ignored" });
      }

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

        await supabaseAdmin.from("payments").update({
          status: "SUCCESS",
          verification_result: { ...data }
        }).eq("id", paymentRecord.id);
      }

      await supabaseAdmin.from("orders").update({
        payment_status: "PAID",
        order_status: "PROCESSING" 
      }).eq("id", orderId);

      await supabaseAdmin.from("seller_orders").update({
        status: "PROCESSING"
      }).eq("parent_order_id", orderId);

      // Ledger Entries for the Parent Order
      // Get all commissions for this order to distribute funds on the ledger
      const { data: commissions } = await supabaseAdmin
        .from("commissions")
        .select("seller_id, gross_amount, commission_amount, seller_net_amount")
        .eq("seller_order_id", orderId); // Wait, orderId is parent_order_id. Commissions are linked to seller_order_id!
        
      // We must fetch seller_orders first
      const { data: sellerOrders } = await supabaseAdmin
        .from("seller_orders")
        .select("id, seller_id")
        .eq("parent_order_id", orderId);
        
      if (sellerOrders) {
        for (const so of sellerOrders) {
          const { data: comm } = await supabaseAdmin
            .from("commissions")
            .select("*")
            .eq("seller_order_id", so.id)
            .single();
            
          if (comm) {
            // Insert Atomic Ledger Records
            const ledgerEntries = [
              {
                seller_id: so.seller_id,
                order_id: orderId,
                paystack_reference: data.reference,
                transaction_type: 'SALE_GROSS',
                amount: comm.gross_amount,
                description: 'Gross sale amount received from customer'
              },
              {
                seller_id: so.seller_id,
                order_id: orderId,
                paystack_reference: data.reference,
                transaction_type: 'ICONJ_COMMISSION',
                amount: -comm.commission_amount,
                description: 'Platform commission deduction'
              },
              {
                seller_id: so.seller_id,
                order_id: orderId,
                paystack_reference: data.reference,
                transaction_type: 'SELLER_EARNING',
                amount: comm.seller_net_amount,
                description: 'Net seller earnings after commission'
              },
              {
                seller_id: so.seller_id,
                order_id: orderId,
                paystack_reference: data.reference,
                transaction_type: 'SETTLEMENT_PENDING',
                amount: comm.seller_net_amount,
                description: 'Funds pending settlement to payout account'
              }
            ];
            await supabaseAdmin.from("financial_ledger").insert(ledgerEntries);
            
            // Mark commission state as AVAILABLE/PENDING
            await supabaseAdmin.from("commissions").update({ status: 'AVAILABLE' }).eq('id', comm.id);
          }
        }
      }
    }

    // Handle Payouts / Settlements (Transfer or Automatic Subaccount Settlement)
    if (event.event === "transfer.success" || event.event === "transfer.failed" || event.event === "settlement.successful") {
      const data = event.data;
      
      // Determine the amount (Paystack sends amounts in kobo for transfers, settlements might be different but usually kobo)
      // Some settlement webhooks send amount in kobo, we'll convert back to NGN
      const amountInNaira = data.amount / 100;
      const reference = data.reference || data.settlement_reference || data.id?.toString();
      
      // Find which seller this belongs to.
      // Paystack might send subaccount code, recipient code, or subaccount object
      const subaccountCode = data.subaccount?.subaccount_code || data.recipient?.recipient_code || data.subaccount_code;
      
      if (subaccountCode) {
        const { data: payoutAcc } = await supabaseAdmin
          .from("seller_payout_accounts")
          .select("seller_id")
          .eq("paystack_subaccount_code", subaccountCode)
          .single();
          
        if (payoutAcc) {
          // Idempotency check
          const txType = (event.event === "transfer.success" || event.event === "settlement.successful") 
            ? 'SETTLEMENT_SUCCESSFUL' 
            : 'SETTLEMENT_FAILED';
            
          const { data: existingLedger } = await supabaseAdmin
            .from('financial_ledger')
            .select('id')
            .eq('paystack_reference', reference)
            .eq('transaction_type', txType)
            .limit(1)
            .single();
            
          if (!existingLedger) {
            await supabaseAdmin.from("financial_ledger").insert([{
              seller_id: payoutAcc.seller_id,
              paystack_reference: reference,
              transaction_type: txType,
              amount: amountInNaira,
              description: txType === 'SETTLEMENT_SUCCESSFUL' 
                ? 'Paystack settlement/transfer successful' 
                : `Paystack settlement failed: ${data.reason || 'Unknown error'}`
            }]);
          }
        }
      }

      await supabaseAdmin.from("payment_events").insert([{
        event_type: event.event,
        payload: event
      }]);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: "Webhook Error" }, { status: 500 });
  }
}
