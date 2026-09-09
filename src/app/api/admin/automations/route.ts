import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { name, trigger_event, steps } = await request.json();
    if (!name || !trigger_event || !steps) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });
    }
    const { data, error } = await supabaseAdmin.from('automation_flows').insert([{
      name, trigger_event, steps, is_active: true,
    }]).select().single();
    if (error) throw error;
    return NextResponse.json({ success: true, flow: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
