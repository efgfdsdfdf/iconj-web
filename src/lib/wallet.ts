import { createClient } from '@supabase/supabase-js';
import { sendEmailTo } from "@/lib/email";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

export interface WalletSettings {
  hold_period_days: number;
  min_withdrawal_amount: number;
  commission_refund_policy: 'FULL_REFUND' | 'KEEP_COMMISSION';
  payout_mode: 'MANUAL' | 'PAYSTACK_TRANSFER';
}

export interface SellerWallet {
  id: string;
  seller_id: string;
  available_balance: number;
  pending_balance: number;
  reserved_balance: number;
  refund_liability: number;
  total_earned: number;
  total_withdrawn: number;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  seller_id: string;
  order_id?: string;
  withdrawal_request_id?: string;
  refund_id?: string;
  type: 'SALE_CREDIT' | 'HOLD_RELEASED' | 'LIABILITY_RECOVERY' | 'WITHDRAWAL_RESERVED' | 'WITHDRAWAL_COMPLETED' | 'WITHDRAWAL_REVERSED' | 'REFUND_DEBIT' | 'ADJUSTMENT';
  amount: number;
  available_balance_after: number;
  pending_balance_after: number;
  reserved_balance_after: number;
  description?: string;
  hold_until?: string;
  idempotency_key: string;
  created_at: string;
}

export interface Refund {
  id: string;
  order_id: string;
  seller_id: string;
  refund_reference: string;
  customer_amount: number;
  seller_debit_amount: number;
  commission_refunded: number;
  reason: string;
  status: string;
  processed_by: string;
  created_at: string;
}

let cachedSettings: WalletSettings | null = null;
let lastSettingsFetch: number = 0;

export async function getWalletSettings(): Promise<WalletSettings> {
  const now = Date.now();
  if (cachedSettings && now - lastSettingsFetch < 1000 * 60 * 5) { // 5 min cache
    return cachedSettings;
  }
  const { data, error } = await supabaseAdmin.from('wallet_settings').select('*').single();
  
  if (error || !data) {
    console.error('Error fetching wallet settings:', error);
    // Return defaults if none found
    return {
      hold_period_days: 7,
      min_withdrawal_amount: 5000,
      commission_refund_policy: 'FULL_REFUND',
      payout_mode: 'MANUAL'
    };
  }
  
  cachedSettings = data as WalletSettings;
  lastSettingsFetch = now;
  return cachedSettings;
}

export async function ensureWalletExists(sellerId: string): Promise<SellerWallet> {
  const { data, error } = await supabaseAdmin
    .from('seller_wallets')
    .upsert(
      { seller_id: sellerId },
      { onConflict: 'seller_id' }
    )
    .select()
    .single();

  if (error) {
    console.error('Error ensuring wallet exists:', error);
    throw new Error('Could not create/fetch wallet');
  }
  
  return data as SellerWallet;
}

export async function creditSellerWallet(sellerId: string, orderId: string, amount: number, description: string): Promise<WalletTransaction | null> {
  const wallet = await ensureWalletExists(sellerId);
  const settings = await getWalletSettings();
  
  const idempotencyKey = `SALE_CREDIT:${orderId}:${sellerId}`;
  
  // Check idempotency
  const { data: existingTx } = await supabaseAdmin
    .from('wallet_transactions')
    .select('*')
    .eq('idempotency_key', idempotencyKey)
    .single();
    
  if (existingTx) {
    return existingTx as WalletTransaction;
  }

  let remainingCredit = amount;
  
  // Handle liability recovery
  if (wallet.refund_liability > 0) {
    const recoveryAmount = Math.min(wallet.refund_liability, remainingCredit);
    remainingCredit -= recoveryAmount;
    
    wallet.refund_liability -= recoveryAmount;
    
    const recoveryIdempotencyKey = `LIABILITY_RECOVERY:${orderId}:${sellerId}`;
    
    const { error: recoveryError } = await supabaseAdmin.from('wallet_transactions').insert({
      seller_id: sellerId,
      order_id: orderId,
      type: 'LIABILITY_RECOVERY',
      amount: recoveryAmount,
      available_balance_after: wallet.available_balance,
      pending_balance_after: wallet.pending_balance,
      reserved_balance_after: wallet.reserved_balance,
      description: `Liability recovery from order ${orderId}`,
      idempotency_key: recoveryIdempotencyKey
    });

    if (recoveryError) {
      console.error('Error recording liability recovery tx:', recoveryError);
      throw new Error('Failed to record liability recovery');
    }
  }

  if (remainingCredit > 0) {
    wallet.pending_balance += remainingCredit;
    wallet.total_earned += remainingCredit;
    
    const { data: creditTx, error: creditError } = await supabaseAdmin.from('wallet_transactions').insert({
      seller_id: sellerId,
      order_id: orderId,
      type: 'SALE_CREDIT',
      amount: remainingCredit,
      available_balance_after: wallet.available_balance,
      pending_balance_after: wallet.pending_balance,
      reserved_balance_after: wallet.reserved_balance,
      description,
      hold_until: new Date(Date.now() + (settings.hold_period_days * 24 * 60 * 60 * 1000)).toISOString(),
      idempotency_key: idempotencyKey
    }).select().single();
    
    if (creditError) {
      console.error('Error recording credit tx:', creditError);
      throw new Error('Failed to record credit transaction');
    }
    
    // Update wallet
    const { error: updateError } = await supabaseAdmin.from('seller_wallets').update({
      pending_balance: wallet.pending_balance,
      refund_liability: wallet.refund_liability,
      total_earned: wallet.total_earned,
      updated_at: new Date().toISOString()
    }).eq('id', wallet.id);

    if (updateError) {
      console.error('Error updating seller wallet:', updateError);
      throw new Error('Failed to update wallet balances');
    }

    return creditTx as WalletTransaction;
  }
  
  // If fully recovered, just return null or update wallet
  const { error: updateError } = await supabaseAdmin.from('seller_wallets').update({
    refund_liability: wallet.refund_liability,
    updated_at: new Date().toISOString()
  }).eq('id', wallet.id);

  if (updateError) {
    console.error('Error updating seller wallet:', updateError);
  }

  return null;
}

export async function releasePendingFunds(): Promise<number> {
  let releasedCount = 0;
  const now = new Date().toISOString();
  
  const { data: pendingCredits, error: fetchError } = await supabaseAdmin
    .from('wallet_transactions')
    .select('*')
    .eq('type', 'SALE_CREDIT')
    .lte('hold_until', now);
    
  if (fetchError) {
    console.error('Error fetching pending credits:', fetchError);
    return 0;
  }

  for (const creditTx of pendingCredits || []) {
    const releaseIdempotencyKey = `HOLD_RELEASED:${creditTx.id}`;
    
    const { data: existingRelease } = await supabaseAdmin
      .from('wallet_transactions')
      .select('id')
      .eq('idempotency_key', releaseIdempotencyKey)
      .single();
      
    if (existingRelease) {
      continue;
    }
    
    const wallet = await getSellerWallet(creditTx.seller_id);
    if (!wallet) continue;
    
    const amountToRelease = Math.min(wallet.pending_balance, creditTx.amount);
    
    if (amountToRelease <= 0) continue;

    wallet.pending_balance -= amountToRelease;
    wallet.available_balance += amountToRelease;
    
    const { error: txError } = await supabaseAdmin.from('wallet_transactions').insert({
      seller_id: wallet.seller_id,
      order_id: creditTx.order_id,
      type: 'HOLD_RELEASED',
      amount: amountToRelease,
      available_balance_after: wallet.available_balance,
      pending_balance_after: wallet.pending_balance,
      reserved_balance_after: wallet.reserved_balance,
      description: `Funds released for order ${creditTx.order_id || 'unknown'}`,
      idempotency_key: releaseIdempotencyKey
    });

    if (txError) {
      console.error('Error inserting HOLD_RELEASED transaction:', txError);
      continue;
    }
    
    const { error: walletError } = await supabaseAdmin.from('seller_wallets').update({
      pending_balance: wallet.pending_balance,
      available_balance: wallet.available_balance,
      updated_at: new Date().toISOString()
    }).eq('id', wallet.id);

    if (walletError) {
      console.error('Error updating wallet balances during release:', walletError);
      continue;
    }
    
    try {
      const { data: seller } = await supabaseAdmin.from('sellers').select('profile_id, stores(store_name)').eq('id', wallet.seller_id).single();
      if (seller?.profile_id) {
        const { data: authData } = await supabaseAdmin.auth.admin.getUserById(seller.profile_id);
        const sellerEmail = authData?.user?.email;
        if (sellerEmail) {
          const shortOrder = creditTx.order_id ? creditTx.order_id.split('-')[0].toUpperCase() : 'Unknown';
          const storeName = seller.stores?.[0]?.store_name || 'Seller';
          
          const html = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
              <div style="background: #10b981; color: white; padding: 20px; text-align: center;">
                <h1 style="margin: 0; font-size: 22px;">Funds Available for Withdrawal! 🎉</h1>
              </div>
              <div style="padding: 30px 20px;">
                <p style="margin: 0 0 16px; font-size: 16px; color: #334155;">Hello <strong>${storeName}</strong>,</p>
                <p style="margin: 0 0 20px; font-size: 15px; color: #475569; line-height: 1.6;">
                  Great news! The escrow period for Order <strong>#${shortOrder}</strong> has successfully completed.
                </p>
                
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 6px; text-align: center; margin-bottom: 24px;">
                  <span style="font-size: 14px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Amount Released</span>
                  <div style="font-size: 28px; font-weight: 800; color: #059669; margin-top: 4px;">₦${amountToRelease.toLocaleString()}</div>
                </div>
                
                <p style="margin: 0 0 24px; font-size: 15px; color: #475569; line-height: 1.6;">
                  These funds have been moved from your Pending Balance to your Available Balance. You can now withdraw them to your bank account at any time.
                </p>
                
                <div style="text-align: center;">
                  <a href="https://iconj-web-rust.vercel.app/seller/wallet" style="display: inline-block; background: #0f172a; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 15px;">
                    Go to Wallet →
                  </a>
                </div>
              </div>
            </div>
          `;
          
          await sendEmailTo(
            sellerEmail, 
            `💰 ₦${amountToRelease.toLocaleString()} is now available for withdrawal! (Order #${shortOrder})`, 
            html
          );
        }
      }
    } catch (emailErr) {
      console.error('Failed to send funds release email:', emailErr);
    }
    
    releasedCount++;
  }
  
  return releasedCount;
}

export async function reserveForWithdrawal(sellerId: string, withdrawalRequestId: string, amount: number): Promise<boolean> {
  const wallet = await getSellerWallet(sellerId);
  if (!wallet) return false;
  
  const idempotencyKey = `WD_RESERVE:${withdrawalRequestId}`;
  
  const { data: existingTx } = await supabaseAdmin
    .from('wallet_transactions')
    .select('*')
    .eq('idempotency_key', idempotencyKey)
    .single();
    
  if (existingTx) return true;
  
  if (wallet.available_balance < amount) {
    return false;
  }
  
  wallet.available_balance -= amount;
  wallet.reserved_balance += amount;
  
  const { error: txError } = await supabaseAdmin.from('wallet_transactions').insert({
    seller_id: sellerId,
    withdrawal_request_id: withdrawalRequestId,
    type: 'WITHDRAWAL_RESERVED',
    amount: amount,
    available_balance_after: wallet.available_balance,
    pending_balance_after: wallet.pending_balance,
    reserved_balance_after: wallet.reserved_balance,
    description: `Funds reserved for withdrawal ${withdrawalRequestId}`,
    idempotency_key: idempotencyKey
  });

  if (txError) {
    console.error('Error inserting WITHDRAWAL_RESERVED transaction:', txError);
    return false;
  }
  
  const { error: updateError } = await supabaseAdmin.from('seller_wallets').update({
    available_balance: wallet.available_balance,
    reserved_balance: wallet.reserved_balance,
    updated_at: new Date().toISOString()
  }).eq('id', wallet.id);
  
  if (updateError) {
    console.error('Error updating wallet reserved balance:', updateError);
    return false;
  }
  
  return true;
}

export async function completeWithdrawal(withdrawalRequestId: string): Promise<boolean> {
  const { data: reserveTx, error: reserveError } = await supabaseAdmin
    .from('wallet_transactions')
    .select('seller_id, amount')
    .eq('type', 'WITHDRAWAL_RESERVED')
    .eq('withdrawal_request_id', withdrawalRequestId)
    .single();
    
  if (reserveError || !reserveTx) {
    console.error('Could not find reserve transaction for completion:', reserveError);
    return false;
  }
  
  const idempotencyKey = `WD_COMPLETE:${withdrawalRequestId}`;
  
  const { data: existingTx } = await supabaseAdmin
    .from('wallet_transactions')
    .select('*')
    .eq('idempotency_key', idempotencyKey)
    .single();
    
  if (existingTx) return true;
  
  const wallet = await getSellerWallet(reserveTx.seller_id);
  if (!wallet) return false;
  
  wallet.reserved_balance -= reserveTx.amount;
  wallet.total_withdrawn += reserveTx.amount;
  
  const { error: txError } = await supabaseAdmin.from('wallet_transactions').insert({
    seller_id: wallet.seller_id,
    withdrawal_request_id: withdrawalRequestId,
    type: 'WITHDRAWAL_COMPLETED',
    amount: reserveTx.amount,
    available_balance_after: wallet.available_balance,
    pending_balance_after: wallet.pending_balance,
    reserved_balance_after: wallet.reserved_balance,
    description: `Withdrawal ${withdrawalRequestId} completed`,
    idempotency_key: idempotencyKey
  });
  
  if (txError) {
    console.error('Error inserting WITHDRAWAL_COMPLETED transaction:', txError);
    return false;
  }
  
  const { error: updateError } = await supabaseAdmin.from('seller_wallets').update({
    reserved_balance: wallet.reserved_balance,
    total_withdrawn: wallet.total_withdrawn,
    updated_at: new Date().toISOString()
  }).eq('id', wallet.id);
  
  if (updateError) {
    console.error('Error updating wallet completed withdrawal:', updateError);
    return false;
  }
  
  return true;
}

export async function reverseWithdrawal(withdrawalRequestId: string): Promise<boolean> {
  const { data: reserveTx, error: reserveError } = await supabaseAdmin
    .from('wallet_transactions')
    .select('seller_id, amount')
    .eq('type', 'WITHDRAWAL_RESERVED')
    .eq('withdrawal_request_id', withdrawalRequestId)
    .single();
    
  if (reserveError || !reserveTx) {
    console.error('Could not find reserve transaction for reversal:', reserveError);
    return false;
  }
  
  const idempotencyKey = `WD_REVERSE:${withdrawalRequestId}`;
  
  const { data: existingTx } = await supabaseAdmin
    .from('wallet_transactions')
    .select('*')
    .eq('idempotency_key', idempotencyKey)
    .single();
    
  if (existingTx) return true;
  
  const wallet = await getSellerWallet(reserveTx.seller_id);
  if (!wallet) return false;
  
  wallet.reserved_balance -= reserveTx.amount;
  wallet.available_balance += reserveTx.amount;
  
  const { error: txError } = await supabaseAdmin.from('wallet_transactions').insert({
    seller_id: wallet.seller_id,
    withdrawal_request_id: withdrawalRequestId,
    type: 'WITHDRAWAL_REVERSED',
    amount: reserveTx.amount,
    available_balance_after: wallet.available_balance,
    pending_balance_after: wallet.pending_balance,
    reserved_balance_after: wallet.reserved_balance,
    description: `Withdrawal ${withdrawalRequestId} reversed`,
    idempotency_key: idempotencyKey
  });
  
  if (txError) {
    console.error('Error inserting WITHDRAWAL_REVERSED transaction:', txError);
    return false;
  }
  
  const { error: updateError } = await supabaseAdmin.from('seller_wallets').update({
    available_balance: wallet.available_balance,
    reserved_balance: wallet.reserved_balance,
    updated_at: new Date().toISOString()
  }).eq('id', wallet.id);
  
  if (updateError) {
    console.error('Error updating wallet reversed withdrawal:', updateError);
    return false;
  }
  
  return true;
}

export async function processRefund(orderId: string, sellerId: string, sellerDebitAmount: number, commissionRefunded: number, reason: string, processedBy: string): Promise<Refund | null> {
  const refundReference = `REFUND:${orderId}:${sellerId}`;
  
  const { data: existingRefund } = await supabaseAdmin
    .from('refunds')
    .select('*')
    .eq('refund_reference', refundReference)
    .single();
    
  if (existingRefund) {
    return existingRefund as Refund;
  }
  
  const wallet = await getSellerWallet(sellerId);
  if (!wallet) throw new Error('Seller wallet not found');
  
  let debitFromPending = 0;
  let debitFromAvailable = 0;
  let remainingDebit = sellerDebitAmount;
  
  if (wallet.pending_balance >= remainingDebit) {
    debitFromPending = remainingDebit;
    remainingDebit = 0;
  } else {
    debitFromPending = wallet.pending_balance;
    remainingDebit -= debitFromPending;
  }
  
  if (remainingDebit > 0) {
    if (wallet.available_balance >= remainingDebit) {
      debitFromAvailable = remainingDebit;
      remainingDebit = 0;
    } else {
      debitFromAvailable = wallet.available_balance;
      remainingDebit -= debitFromAvailable;
    }
  }
  
  const addedLiability = remainingDebit;
  
  wallet.pending_balance -= debitFromPending;
  wallet.available_balance -= debitFromAvailable;
  wallet.refund_liability += addedLiability;
  
  const { data: newRefund, error: refundError } = await supabaseAdmin.from('refunds').insert({
    order_id: orderId,
    seller_id: sellerId,
    refund_reference: refundReference,
    customer_amount: sellerDebitAmount + commissionRefunded,
    seller_debit_amount: sellerDebitAmount,
    commission_refunded: commissionRefunded,
    reason,
    status: 'COMPLETED',
    processed_by: processedBy
  }).select().single();
  
  if (refundError) {
    console.error('Error inserting refund:', refundError);
    throw new Error('Failed to record refund');
  }
  
  const idempotencyKey = `REFUND_DEBIT:${newRefund.id}`;
  const { error: txError } = await supabaseAdmin.from('wallet_transactions').insert({
    seller_id: sellerId,
    order_id: orderId,
    refund_id: newRefund.id,
    type: 'REFUND_DEBIT',
    amount: sellerDebitAmount,
    available_balance_after: wallet.available_balance,
    pending_balance_after: wallet.pending_balance,
    reserved_balance_after: wallet.reserved_balance,
    description: `Refund processed for order ${orderId}`,
    idempotency_key: idempotencyKey
  });

  if (txError) {
    console.error('Error inserting REFUND_DEBIT transaction:', txError);
  }
  
  const { error: updateError } = await supabaseAdmin.from('seller_wallets').update({
    pending_balance: wallet.pending_balance,
    available_balance: wallet.available_balance,
    refund_liability: wallet.refund_liability,
    updated_at: new Date().toISOString()
  }).eq('id', wallet.id);
  
  if (updateError) {
    console.error('Error updating wallet balances after refund:', updateError);
  }
  
  return newRefund as Refund;
}

export async function getSellerWallet(sellerId: string): Promise<SellerWallet | null> {
  const { data, error } = await supabaseAdmin
    .from('seller_wallets')
    .select('*')
    .eq('seller_id', sellerId)
    .single();
    
  if (error || !data) {
    return null;
  }
  
  return data as SellerWallet;
}

export async function getWalletTransactions(sellerId: string, limit: number = 20): Promise<WalletTransaction[]> {
  const { data, error } = await supabaseAdmin
    .from('wallet_transactions')
    .select('*')
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false })
    .limit(limit);
    
  if (error) {
    console.error('Error fetching wallet transactions:', error);
    return [];
  }
  
  return data as WalletTransaction[];
}
