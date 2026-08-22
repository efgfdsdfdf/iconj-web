import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspectStatuses() {
  const { data: orderStatuses } = await supabaseAdmin.from('orders').select('order_status');
  const uniqueOrderStatuses = [...new Set(orderStatuses?.map(o => o.order_status))];
  
  const { data: paymentStatuses } = await supabaseAdmin.from('orders').select('payment_status');
  const uniquePaymentStatuses = [...new Set(paymentStatuses?.map(o => o.payment_status))];

  console.log('Unique Order Statuses:', uniqueOrderStatuses);
  console.log('Unique Payment Statuses:', uniquePaymentStatuses);
}
inspectStatuses();
