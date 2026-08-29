import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { completeWithdrawal, reverseWithdrawal } from '@/lib/wallet';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-paystack-signature');
    const secret = process.env.PAYSTACK_SECRET_KEY || '';

    // Verify webhook signature
    const hash = crypto.createHmac('sha512', secret).update(body).digest('hex');
    if (!signature || hash !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(body);
    const eventType = event.event;
    const data = event.data || {};

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    if (eventType === 'transfer.success') {
      const reference = data.reference;
      const transferCode = data.transfer_code;

      let query = supabaseAdmin.from('withdrawal_requests').select('*');
      if (reference && transferCode) {
        query = query.or(`paystack_reference.eq.${reference},paystack_transfer_code.eq.${transferCode}`);
      } else if (reference) {
        query = query.eq('paystack_reference', reference);
      } else if (transferCode) {
        query = query.eq('paystack_transfer_code', transferCode);
      } else {
        return NextResponse.json({ received: true, message: 'No reference or transfer code provided' });
      }

      const { data: withdrawalRequest, error } = await query.limit(1).maybeSingle();

      if (error) {
        console.error('Error fetching withdrawal request:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }

      if (!withdrawalRequest) {
        console.warn(`Withdrawal request not found for ref: ${reference}, code: ${transferCode}`);
        return NextResponse.json({ received: true, message: 'Withdrawal request not found' });
      }

      // Idempotency check: if already completed, do not process again
      if (withdrawalRequest.status === 'COMPLETED') {
        return NextResponse.json({ received: true, message: 'Withdrawal already completed' });
      }

      await completeWithdrawal(withdrawalRequest.id);

      await supabaseAdmin
        .from('withdrawal_requests')
        .update({
          status: 'COMPLETED',
          processed_at: new Date().toISOString()
        })
        .eq('id', withdrawalRequest.id);

      return NextResponse.json({ success: true, message: 'Withdrawal completed successfully' });
    }

    if (eventType === 'transfer.failed' || eventType === 'transfer.reversed') {
      const reference = data.reference;
      const transferCode = data.transfer_code;

      let query = supabaseAdmin.from('withdrawal_requests').select('*');
      if (reference && transferCode) {
        query = query.or(`paystack_reference.eq.${reference},paystack_transfer_code.eq.${transferCode}`);
      } else if (reference) {
        query = query.eq('paystack_reference', reference);
      } else if (transferCode) {
        query = query.eq('paystack_transfer_code', transferCode);
      } else {
        return NextResponse.json({ received: true, message: 'No reference or transfer code provided' });
      }

      const { data: withdrawalRequest, error } = await query.limit(1).maybeSingle();

      if (error) {
        console.error('Error fetching withdrawal request:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }

      if (!withdrawalRequest) {
        console.warn(`Withdrawal request not found for ref: ${reference}, code: ${transferCode}`);
        return NextResponse.json({ received: true, message: 'Withdrawal request not found' });
      }

      // Idempotency check: if already failed or reversed, do not process again
      if (withdrawalRequest.status === 'FAILED') {
        return NextResponse.json({ received: true, message: 'Withdrawal already marked as failed' });
      }

      await reverseWithdrawal(withdrawalRequest.id);

      const reason = data.reason || data.message || `Transfer ${eventType === 'transfer.reversed' ? 'reversed' : 'failed'}`;

      await supabaseAdmin
        .from('withdrawal_requests')
        .update({
          status: 'FAILED',
          admin_note: reason,
          processed_at: new Date().toISOString()
        })
        .eq('id', withdrawalRequest.id);

      return NextResponse.json({ success: true, message: 'Withdrawal reversed successfully' });
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Paystack transfer webhook error:', error);
    return NextResponse.json(
      { error: error?.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
