'use server';

import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/auth/admin';
import { revalidatePath } from 'next/cache';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function updatePayoutMode(mode: 'MANUAL' | 'PAYSTACK_TRANSFER') {
  try {
    await requireAdmin();
    
    const { error } = await supabaseAdmin
      .from('wallet_settings')
      .update({ payout_mode: mode })
      .neq('id', '00000000-0000-0000-0000-000000000000'); // generic update since there's only 1 row
      
    if (error) throw error;
    
    revalidatePath('/admin/settings');
    revalidatePath('/admin/payouts');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
