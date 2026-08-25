require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanUp() {
  const email = "ezeilodavid292@gmail.com";
  console.log("Cleaning up for email:", email);
  
  const { data: user } = await supabase.from('profiles').select('*').eq('email', email).single();
  if (!user) {
    console.log("Profile not found.");
    return;
  }
  
  const { data: sellers } = await supabase
    .from('sellers')
    .select('id, status, created_at, business_id')
    .eq('profile_id', user.id);
    
  for (const s of sellers) {
    if (s.status === 'rejected') {
      console.log(`Deleting rejected seller: ${s.id}`);
      
      // Delete the seller record
      await supabase.from('sellers').delete().eq('id', s.id);
      
      // Delete the business record if it exists
      if (s.business_id) {
        console.log(`Deleting associated business: ${s.business_id}`);
        await supabase.from('businesses').delete().eq('id', s.business_id);
      }
    }
  }
  
  const { data: remaining } = await supabase
    .from('sellers')
    .select('id, status')
    .eq('profile_id', user.id);
    
  console.log("Remaining sellers:", remaining);
}

cleanUp();
