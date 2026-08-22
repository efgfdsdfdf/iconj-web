import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function runAudit() {
  console.log('--- STARTING DATABASE AUDIT ---');
  
  // 1. Check Schema
  const { error: schemaError } = await supabase.from('supplier_transactions').select('supplier_id').limit(1);
  if (schemaError) {
    console.error('FAIL: Schema check failed.', schemaError.message);
    return;
  }
  console.log('PASS: Schema is correct.');

  const { data: supplier, error: suppErr } = await supabase.from('suppliers').insert({ name: 'Audit Test Supplier' }).select().single();
  if (suppErr) { console.error('FAIL: Could not create test supplier', suppErr); return; }
  const supplierId = supplier.id;

  // 2. New Customer Order
  console.log('2. Creating test order');
  const { data: order, error: orderErr } = await supabase.from('orders').insert({
    total_amount: 10000,
    supplier_cost: 6000,
    estimated_profit: 4000,
    payment_status: 'PENDING',
    order_status: 'NEW',
    supplier_id: supplierId,
    delivery_address: { street: '123 Fake St' }
  }).select().single();
  
  if (orderErr) { console.error('FAIL: Order creation failed', orderErr); return; }
  const orderId = order.id;
  console.log('PASS: Order created. ID:', orderId);

  // 3. Simulate Paystack Payment
  const { error: payErr } = await supabase.from('orders').update({
    payment_status: 'PAID',
    order_status: 'PAYMENT_CONFIRMED',
    admin_viewed: false
  }).eq('id', orderId);
  if (payErr) { console.error('FAIL: Paystack update failed', payErr); return; }
  console.log('PASS: Order marked PAID and UNVIEWED.');

  // 4. Admin Viewing Order
  const { error: viewErr } = await supabase.from('orders').update({ admin_viewed: true }).eq('id', orderId);
  if (viewErr) { console.error('FAIL: Admin view update failed', viewErr); return; }
  console.log('PASS: Order marked VIEWED.');

  // 5. Send to Supplier
  const { error: sendErr } = await supabase.from('orders').update({
    supplier_sent: true,
    supplier_order_status: 'SENT'
  }).eq('id', orderId);
  if (sendErr) { console.error('FAIL: Send to supplier failed', sendErr); return; }
  console.log('PASS: Order sent to supplier.');

  // 6. Test Negative Balance Prevention
  const { error: negErr } = await supabase.from('supplier_transactions').insert({
    supplier_id: supplierId,
    order_id: orderId,
    transaction_type: 'SUPPLIER_PAYMENT',
    credit_debit: 'DEBIT',
    amount: 6000
  });
  if (!negErr || !negErr.message.includes('Insufficient supplier balance')) {
    console.error('FAIL: Negative balance prevention did not trigger correctly!', negErr);
  } else {
    console.log('PASS: Negative balance successfully prevented.');
  }

  // 7. Add Funds
  const { error: fundErr } = await supabase.from('supplier_transactions').insert({
    supplier_id: supplierId,
    transaction_type: 'FUNDS_ADDED',
    credit_debit: 'CREDIT',
    amount: 10000
  });
  if (fundErr) { console.error('FAIL: Add funds failed', fundErr); return; }
  console.log('PASS: Funds added successfully.');

  // 8. Record Payment
  const { error: paySuppErr } = await supabase.from('supplier_transactions').insert({
    supplier_id: supplierId,
    order_id: orderId,
    transaction_type: 'SUPPLIER_PAYMENT',
    credit_debit: 'DEBIT',
    amount: 6000
  });
  if (paySuppErr) { console.error('FAIL: Record payment failed', paySuppErr); return; }
  console.log('PASS: Payment recorded successfully.');

  // 9. Check Balance Match
  const { data: txs, error: txsErr } = await supabase.from('supplier_transactions')
    .select('new_balance')
    .eq('supplier_id', supplierId)
    .order('sequence_num', { ascending: false })
    .limit(1);
  if (txsErr || txs[0].new_balance !== 4000) {
    console.error('FAIL: Balance is incorrect!', txs);
  } else {
    console.log('PASS: Balance correctly calculated via trigger (10000 - 6000 = 4000).');
  }

  // 10. Test Duplicate Payment Prevention
  const { error: dupErr } = await supabase.from('supplier_transactions').insert({
    supplier_id: supplierId,
    order_id: orderId, // SAME ORDER ID
    transaction_type: 'SUPPLIER_PAYMENT',
    credit_debit: 'DEBIT',
    amount: 1000
  });
  if (!dupErr || (!dupErr.message.includes('unique constraint') && !dupErr.message.includes('idx_unique_supplier_payment'))) {
    console.error('FAIL: Duplicate payment was allowed!', dupErr);
  } else {
    console.log('PASS: Duplicate payment successfully prevented.');
  }

  // 11. Test Immutability
  const { error: delErr } = await supabase.from('supplier_transactions').delete().eq('supplier_id', supplierId);
  if (!delErr || !delErr.message.includes('immutable')) {
    console.error('FAIL: Immutability trigger failed!', delErr);
  } else {
    console.log('PASS: Ledger immutability correctly enforced.');
  }

  console.log('--- AUDIT COMPLETE ---');
}

runAudit();
