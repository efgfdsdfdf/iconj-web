const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function updateOrder() {
  const reference = '438b5105-d969-45c8-b862-721660aa77d0';
  const { error } = await supabaseAdmin
    .from('orders')
    .update({
      payment_status: 'paid',
      order_status: 'processing'
    })
    .eq('id', reference);
  console.log('Update Error:', error);
}
updateOrder();
