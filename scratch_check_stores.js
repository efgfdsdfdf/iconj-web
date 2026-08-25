require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkStores() {
  const profileId = 'da75b8cd-579c-4073-8888-9c28d67aa7dd';
  
  const { data: sellers } = await supabase
    .from('sellers')
    .select('id, created_at, stores(id, store_name)')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false });
    
  console.dir(sellers, { depth: null });
}

checkStores();
