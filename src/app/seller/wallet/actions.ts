'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { reserveForWithdrawal, reverseWithdrawal } from '@/lib/wallet';
import { sendAdminNotification } from '@/lib/email';
import crypto from 'crypto';

export async function requestWithdrawal(formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Not authenticated' };
    }

    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: seller } = await adminSupabase
      .from('sellers')
      .select('id')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!seller) {
      return { error: 'Seller account not found' };
    }

    const amount = Number(formData.get('amount'));
    if (isNaN(amount) || amount <= 0) {
      return { error: 'Invalid amount' };
    }

    const { data: settings } = await adminSupabase
      .from('wallet_settings')
      .select('min_withdrawal_amount, payout_mode')
      .single();

    const minAmount = settings?.min_withdrawal_amount || 0;
    if (amount < minAmount) {
      return { error: `Minimum withdrawal amount is ₦${minAmount}` };
    }

    const { data: wallet } = await adminSupabase
      .from('seller_wallets')
      .select('id, available_balance')
      .eq('seller_id', seller.id)
      .single();

    if (!wallet) {
      return { error: 'Wallet not found' };
    }

    if (amount > wallet.available_balance) {
      return { error: 'Insufficient funds' };
    }

    const { data: existingRequests } = await adminSupabase
      .from('withdrawal_requests')
      .select('id')
      .eq('seller_id', seller.id)
      .in('status', ['PENDING', 'APPROVED', 'PROCESSING'])
      .limit(1);

    if (existingRequests && existingRequests.length > 0) {
      return { error: 'You already have a pending withdrawal request' };
    }

    const { data: payoutAccount } = await adminSupabase
      .from('seller_payout_accounts')
      .select('*')
      .eq('seller_id', seller.id)
      .eq('is_primary', true)
      .single();

    if (!payoutAccount) {
      return { error: 'No primary payout account found' };
    }

    const requestId = crypto.randomUUID();

    const reserved = await reserveForWithdrawal(seller.id, requestId, amount);
    if (!reserved) {
      return { error: 'Failed to reserve funds or insufficient available balance' };
    }

    const { error: insertError } = await adminSupabase
      .from('withdrawal_requests')
      .insert({
        id: requestId,
        seller_id: seller.id,
        amount,
        status: 'PENDING',
        payout_mode: settings?.payout_mode || 'MANUAL',
        bank_name: payoutAccount.bank_name,
        account_number: payoutAccount.account_number,
        account_name: payoutAccount.account_name,
        bank_code: payoutAccount.bank_code || null,
      });

    if (insertError) {
      await reverseWithdrawal(requestId);
      throw insertError;
    }

    try {
      await sendAdminNotification(
        'New Withdrawal Request',
        `A new withdrawal request for ₦${amount} has been submitted by seller ID: ${seller.id}.`
      );
    } catch (e) {
      console.error('Failed to send admin notification', e);
    }

    revalidatePath('/seller/wallet');
    return { success: true };
  } catch (error: any) {
    console.error('Withdrawal error:', error);
    return { error: error.message || 'Failed to process withdrawal request' };
  }
}
