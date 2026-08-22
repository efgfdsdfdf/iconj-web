import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkConstraints() {
  const { data, error } = await supabase.rpc('get_table_constraints', { p_table: 'supplier_transactions' });
  if (error) {
     console.error('RPC failed, trying raw query', error);
  }
}

checkConstraints();
