require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkStoreActive() {
  const { data } = await supabase.from('stores').select('id, store_name, is_active').eq('seller_id', 'ba7a1dcb-d66a-45a7-97ea-9de8c5b86109');
  console.log(data);
}

checkStoreActive();
