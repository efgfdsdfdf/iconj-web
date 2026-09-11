import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { name, email, referral_code, commission_type, commission_value } = await request.json();
    if (!referral_code || !commission_value) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });
    }

    let user_id = null;
    if (email) {
      const { data: profile } = await supabaseAdmin.from('profiles').select('id').eq('email', email.trim()).single();
      if (profile) user_id = profile.id;
    }

    const { data, error } = await supabaseAdmin.from('referral_partners').insert([{
      user_id, referral_code, commission_type, commission_value: Number(commission_value), is_active: true, partner_type: 'affiliate'
    }]).select().single();

    if (error) throw error;
    return NextResponse.json({ success: true, partner: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
