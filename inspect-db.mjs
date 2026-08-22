import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspectSchema() {
  const { data, error } = await supabaseAdmin.rpc('get_schema_info');
  if (error) {
    // If rpc doesn't exist, let's just query one row from each table to inspect types
    const { data: orders } = await supabaseAdmin.from('orders').select('*').limit(1);
    console.log('Orders Schema:', orders ? Object.keys(orders[0]).map(k => typeof orders[0][k]) : 'No orders');
    console.log('Order Example:', orders ? orders[0] : null);
  }
}
inspectSchema();
