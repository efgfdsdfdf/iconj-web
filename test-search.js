require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const search = 'window, blind';
  const { data, error } = await supabase.from('products').select('name, sku').or('name.ilike.%' + search + '%,sku.ilike.%' + search + '%');
  console.log('Result:', data?.length, error);
}
run();
