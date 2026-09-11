"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

const getAdminSupabase = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

export async function createCampaign(data: any) {
  const supabase = getAdminSupabase();
  const { error } = await supabase.from('email_campaigns').insert(data);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/marketing');
}

export async function updateCampaign(id: string, data: any) {
  const supabase = getAdminSupabase();
  const { error } = await supabase.from('email_campaigns').update(data).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/marketing');
}

export async function deleteCampaign(id: string) {
  const supabase = getAdminSupabase();
  const { error } = await supabase.from('email_campaigns').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/marketing');
}

export async function updateCoupon(id: string, data: any) {
  const supabase = getAdminSupabase();
  const { error } = await supabase.from('coupons').update(data).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/marketing/coupons');
}

export async function updateLandingPage(id: string, data: any) {
  const supabase = getAdminSupabase();
  const { error } = await supabase.from('landing_pages').update(data).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/marketing/landing-pages');
}
