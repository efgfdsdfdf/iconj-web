require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanUpOther() {
  const profileId = 'da75b8cd-579c-4073-8888-9c28d67aa7dd';
  
  // Get all sellers for this profile ordered by newest first
  const { data: sellers } = await supabase
    .from('sellers')
    .select('id, business_id')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false });
    
  if (!sellers || sellers.length <= 1) {
    console.log("No duplicates to clean up.");
    return;
  }
  
  // Keep the first (newest) one, delete the rest
  const toKeep = sellers[0];
  const toDelete = sellers.slice(1);
  
  console.log(`Keeping seller: ${toKeep.id}`);
  
  for (const s of toDelete) {
    console.log(`Deleting duplicate seller: ${s.id}`);
    
    // The stores table has a foreign key to seller_id with ON DELETE CASCADE,
    // so deleting the seller should automatically delete their stores.
    // However, business_id is linked to the seller. We should delete the business too.
    
    await supabase.from('sellers').delete().eq('id', s.id);
    
    if (s.business_id) {
      console.log(`Deleting duplicate business: ${s.business_id}`);
      await supabase.from('businesses').delete().eq('id', s.business_id);
    }
  }
  
  console.log("Cleanup complete for scam65553@gmail.com!");
}

cleanUpOther();
