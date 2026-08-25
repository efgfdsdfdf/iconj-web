require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkRoles() {
  const profileId = '2c576b34-6093-4143-97d5-e3ea5e3ac911'; // ezeilodavid292@gmail.com
  
  const { data: roles } = await supabase
    .from('user_roles')
    .select('*')
    .eq('user_id', profileId);
    
  console.log("Roles for user:", roles);
}

checkRoles();
