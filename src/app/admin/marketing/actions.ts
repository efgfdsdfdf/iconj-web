"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createCampaign(data: any) {
  const supabase = await createClient();
  const { error } = await supabase.from('email_campaigns').insert(data);
  if (error) throw error;
  revalidatePath('/admin/marketing');
}

export async function updateCampaign(id: string, data: any) {
  const supabase = await createClient();
  const { error } = await supabase.from('email_campaigns').update(data).eq('id', id);
  if (error) throw error;
  revalidatePath('/admin/marketing');
}

export async function deleteCampaign(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('email_campaigns').delete().eq('id', id);
  if (error) throw error;
  revalidatePath('/admin/marketing');
}
