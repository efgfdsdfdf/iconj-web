const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkProfiles() {
  const { data, error, count } = await supabaseAdmin.from('profiles').select('*', { count: 'exact', head: false });
  console.log('Profiles Count:', count);
  console.log('Profiles Data:', data);
  console.log('Error:', error);
}

checkProfiles();
