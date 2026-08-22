import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkConstraints() {
  const { data, error: insertError } = await supabaseAdmin.from('orders').insert({
    total_amount: 1,
    shipping_cost: 0,
    supplier_cost: 0,
    estimated_profit: 0,
    payment_status: 'TEST_STATUS_123',
    order_status: 'pending_payment',
    delivery_address: {}
  }).select();
  
  console.log('Insert Error:', JSON.stringify(insertError, null, 2));
}

checkConstraints();
