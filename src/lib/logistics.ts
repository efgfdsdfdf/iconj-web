import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function getActiveForwarder() {
  const { data } = await supabaseAdmin.from('freight_forwarders').select('*').eq('is_active', true).single();
  return data;
}

export async function getLogisticsIssues(orderId: string) {
  const { data } = await supabaseAdmin.from('logistics_issues').select('*').eq('order_id', orderId);
  return data || [];
}
