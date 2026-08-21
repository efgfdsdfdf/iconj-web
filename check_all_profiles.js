const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkProfiles() {
  const { data, error } = await supabaseAdmin.from('profiles').select('*');
  console.log('Profiles:', data);
  const auth = await supabaseAdmin.auth.admin.listUsers();
  console.log('Auth Users:', auth.data.users.map(u => u.email));
}
checkProfiles();
