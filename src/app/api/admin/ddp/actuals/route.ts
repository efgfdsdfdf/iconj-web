import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    const { data, error } = await supabaseAdmin.from('order_actual_ddp').select('*, orders(id, paystack_reference)').order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ success: true, actuals: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { order_id, actual_shipping, actual_tax, currency, courier, invoice_reference, supplier_notes } = body;

    if (!order_id || actual_shipping === undefined || actual_tax === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const total_actual = Number(actual_shipping) + Number(actual_tax);

    // Fetch original estimated DDP from the products in this order.
    // For simplicity, we compare the total actual DDP to the sum of estimated DDPs of the products in the order.
    const { data: orderItems } = await supabaseAdmin.from('order_items').select('product_id, quantity').eq('order_id', order_id);
    
    let total_estimated = 0;
    if (orderItems) {
      for (const item of orderItems) {
        // Fetch the active estimate for this product at the time (we'll just fetch the current one for now as a rough proxy)
        const { data: est } = await supabaseAdmin.from('ddp_estimates').select('estimated_ddp, quantity_basis').eq('product_id', item.product_id).eq('is_current', true).single();
        if (est && est.quantity_basis > 0) {
           const factor = item.quantity / est.quantity_basis;
           total_estimated += (est.estimated_ddp * factor);
        }
      }
    }

    const variance = total_actual - total_estimated;

    const { data, error } = await supabaseAdmin.from('order_actual_ddp').insert([{
      order_id,
      actual_shipping: Number(actual_shipping),
      actual_tax: Number(actual_tax),
      total_actual_ddp: total_actual,
      currency: currency || 'NGN',
      courier: courier || null,
      invoice_reference: invoice_reference || null,
      supplier_notes: supplier_notes || null,
      variance
    }]).select().single();

    if (error) throw error;
    return NextResponse.json({ success: true, actual_ddp: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
