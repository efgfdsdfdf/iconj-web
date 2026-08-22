import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function createDashboardHelper() {
  // Let's create an RPC to fetch dashboard stats efficiently if needed, or just test a query.
  const { data, error } = await supabaseAdmin.from('supplier_transactions')
    .select('supplier_id, new_balance')
    .order('sequence_num', { ascending: false })
    .limit(100);
  
  console.log(data, error);
}

createDashboardHelper();
