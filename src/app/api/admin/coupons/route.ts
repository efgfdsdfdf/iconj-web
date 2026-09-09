import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, discount_type, discount_value, min_order_amount, usage_limit, expires_at } = body;

    if (!code || !discount_type || !discount_value) {
      return NextResponse.json({ error: 'code, discount_type, and discount_value are required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('coupons')
      .insert([{
        code: code.toUpperCase(),
        discount_type,
        discount_value: Number(discount_value),
        min_order_amount: min_order_amount || null,
        usage_limit: usage_limit || null,
        expires_at: expires_at || null,
        times_used: 0,
        is_active: true,
      }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: `Coupon code "${code}" already exists. Try a different code.` }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ success: true, coupon: data });
  } catch (err: any) {
    console.error('Coupon create error:', err);
    return NextResponse.json({ error: err.message || 'Failed to create coupon' }, { status: 500 });
  }
}
