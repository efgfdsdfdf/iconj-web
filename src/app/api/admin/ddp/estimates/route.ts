import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('product_id');

    let query = supabaseAdmin.from('ddp_estimates').select('*').order('created_at', { ascending: false });
    
    if (productId) {
      query = query.eq('product_id', productId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, estimates: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { estimates } = body; // Array of estimates from bulk entry

    if (!Array.isArray(estimates) || estimates.length === 0) {
      return NextResponse.json({ error: 'No estimates provided' }, { status: 400 });
    }

    const results = [];
    for (const est of estimates) {
      if (!est.product_id || !est.estimated_ddp) continue;
      
      // Mark previous estimates for this product as not current
      await supabaseAdmin.from('ddp_estimates').update({ is_current: false }).eq('product_id', est.product_id);
      
      // Insert new estimate
      const { data, error } = await supabaseAdmin.from('ddp_estimates').insert([{
        product_id: est.product_id,
        variant_id: est.variant_id || null,
        standard_size: est.standard_size || null,
        quantity_basis: est.quantity_basis || 1,
        estimated_ddp: Number(est.estimated_ddp),
        currency: est.currency || 'NGN',
        courier: est.courier || null,
        supplier_notes: est.supplier_notes || null,
        is_current: true
      }]).select().single();

      if (error) throw error;
      results.push(data);
    }

    return NextResponse.json({ success: true, count: results.length, estimates: results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
