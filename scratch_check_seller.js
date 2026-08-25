require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkStatus() {
  const email = "ezeilodavid292@gmail.com";
  console.log("Checking for email:", email);
  
  const { data: user } = await supabase.from('profiles').select('*').eq('email', email).single();
  if (!user) {
    console.log("Profile not found.");
    return;
  }
  console.log("Profile ID:", user.id);
  
  const { data: sellers } = await supabase
    .from('sellers')
    .select('id, status, created_at, profile_id')
    .eq('profile_id', user.id)
    .order('created_at', { ascending: false });
    
  console.log("Sellers found:", sellers);
}

checkStatus();
