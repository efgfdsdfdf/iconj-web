'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function toggleFlowStatus(id: string, currentStatus: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from('automation_flows').update({ is_active: !currentStatus }).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/marketing/automations');
}

export async function deleteFlow(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('automation_flows').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/marketing/automations');
}
