import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { name, description, filter_rules } = await request.json();
    if (!name || !filter_rules) {
      return NextResponse.json({ error: 'Name and rules required' }, { status: 400 });
    }
    
    const { data, error } = await supabaseAdmin.from('customer_segments').insert([{
      name, description, filter_rules, is_dynamic: true,
    }]).select().single();
    
    if (error) throw error;
    return NextResponse.json({ success: true, segment: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
