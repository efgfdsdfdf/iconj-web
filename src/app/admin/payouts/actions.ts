'use server';

import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/auth/admin';
import { revalidatePath } from 'next/cache';
import { completeWithdrawal, reverseWithdrawal } from '@/lib/wallet';
import { createTransferRecipient, initiateTransfer } from '@/lib/paystack-transfers';
import { sendEmailTo } from '@/lib/email';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function approveWithdrawal(requestId: string) {
  try {
    const adminId = await requireAdmin();
    
    // Fetch the withdrawal_request by id
    const { data: request, error: fetchError } = await supabaseAdmin
      .from('withdrawal_requests')
      .select('*, sellers(profile_id)')
      .eq('id', requestId)
      .single();
      
    if (fetchError || !request) {
      throw new Error('Withdrawal request not found');
    }
    
    if (request.status !== 'PENDING') {
      throw new Error('Withdrawal request is not in PENDING status');
    }
    
    // Fetch wallet_settings
    const { data: walletSettings } = await supabaseAdmin
      .from('wallet_settings')
      .select('*')
      .single();
      
    const payoutMode = walletSettings?.payout_mode || 'MANUAL';
    
    // Update to APPROVED
    const { error: updateError } = await supabaseAdmin
      .from('withdrawal_requests')
      .update({
        status: 'APPROVED',
        approved_by: adminId,
        approved_at: new Date().toISOString(),
      })
      .eq('id', requestId);
      
    if (updateError) throw updateError;
    
    if (payoutMode === 'PAYSTACK_TRANSFER') {
      try {
        const recipientResponse = await createTransferRecipient(
          request.bank_code,
          request.account_number,
          request.account_name
        );
        
        if (!recipientResponse.success || !recipientResponse.recipient_code) {
          throw new Error(recipientResponse.error || "Failed to create transfer recipient");
        }

        const transferResponse = await initiateTransfer(
          request.amount,
          recipientResponse.recipient_code,
          'ICONJ Seller Payout',
          requestId
        );

        if (!transferResponse.success || !transferResponse.transfer_code) {
          throw new Error(transferResponse.error || "Failed to initiate transfer");
        }
        
        await supabaseAdmin
          .from('withdrawal_requests')
          .update({
            status: 'PROCESSING',
            paystack_transfer_code: transferResponse.transfer_code,
            paystack_recipient_code: recipientResponse.recipient_code,
            paystack_reference: transferResponse.reference
          })
          .eq('id', requestId);
      } catch (err: any) {
         throw new Error('Failed to initiate Paystack transfer: ' + err.message);
      }
    }
    
    // Notify seller via email
    if (request.sellers?.profile_id) {
       const { data: profile } = await supabaseAdmin
         .from('profiles')
         .select('email')
         .eq('id', request.sellers.profile_id)
         .single();
         
       if (profile?.email) {
         await sendEmailTo(profile.email, 'Withdrawal Approved', `Your withdrawal request for ₦${request.amount} has been approved.`);
       }
    }
    
    revalidatePath('/admin/payouts');
    return { success: true };
    
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function rejectWithdrawal(requestId: string, reason: string) {
  try {
    const adminId = await requireAdmin();
    
    const { data: request, error: fetchError } = await supabaseAdmin
      .from('withdrawal_requests')
      .select('*, sellers(profile_id)')
      .eq('id', requestId)
      .single();
      
    if (fetchError || !request) throw new Error('Withdrawal request not found');
    if (request.status !== 'PENDING') throw new Error('Withdrawal request is not PENDING');
    
    await reverseWithdrawal(requestId);
    
    const { error: updateError } = await supabaseAdmin
      .from('withdrawal_requests')
      .update({
        status: 'REJECTED',
        rejected_by: adminId,
        rejected_at: new Date().toISOString(),
        admin_note: reason
      })
      .eq('id', requestId);
      
    if (updateError) throw updateError;
    
    // Notify seller
    if (request.sellers?.profile_id) {
       const { data: profile } = await supabaseAdmin
         .from('profiles')
         .select('email')
         .eq('id', request.sellers.profile_id)
         .single();
         
       if (profile?.email) {
         await sendEmailTo(profile.email, 'Withdrawal Rejected', `Your withdrawal request for ₦${request.amount} was rejected. Reason: ${reason}`);
       }
    }
    
    revalidatePath('/admin/payouts');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function markWithdrawalPaid(requestId: string) {
  try {
    const adminId = await requireAdmin();
    
    const { data: request, error: fetchError } = await supabaseAdmin
      .from('withdrawal_requests')
      .select('*, sellers(profile_id)')
      .eq('id', requestId)
      .single();
      
    if (fetchError || !request) throw new Error('Withdrawal request not found');
    if (request.status !== 'APPROVED' && request.status !== 'PROCESSING') {
      throw new Error('Withdrawal request is not in a valid state to be marked paid');
    }
    
    await completeWithdrawal(requestId);
    
    const { error: updateError } = await supabaseAdmin
      .from('withdrawal_requests')
      .update({
        status: 'COMPLETED',
        processed_by: adminId,
        processed_at: new Date().toISOString(),
      })
      .eq('id', requestId);
      
    if (updateError) throw updateError;
    
    // Notify seller
    if (request.sellers?.profile_id) {
       const { data: profile } = await supabaseAdmin
         .from('profiles')
         .select('email')
         .eq('id', request.sellers.profile_id)
         .single();
         
       if (profile?.email) {
         await sendEmailTo(profile.email, 'Withdrawal Processed', `Your withdrawal request for ₦${request.amount} has been processed and completed.`);
       }
    }
    
    revalidatePath('/admin/payouts');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
