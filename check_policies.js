const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkPolicies() {
  const { data, error } = await supabaseAdmin.from('orders').select('*').limit(1);
  console.log('Admin Fetch:', error ? error : 'Success (Admin bypasses RLS)');
  // We can't easily fetch policies without sql, but if a normal user query fails or returns 0...
}
checkPolicies();
