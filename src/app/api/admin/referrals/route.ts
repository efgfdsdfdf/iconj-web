import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { name, email, referral_code, commission_type, commission_value } = await request.json();
    if (!name || !referral_code || !commission_value) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });
    }
    const { data, error } = await supabaseAdmin.from('referral_partners').insert([{
      name, email, referral_code, commission_type, commission_value: Number(commission_value), status: 'active',
    }]).select().single();
    if (error) throw error;
    return NextResponse.json({ success: true, partner: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
