import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // We only track events for logged-in users right now
    if (!user) {
      return NextResponse.json({ success: true, note: 'Guest tracking disabled' });
    }

    const { event_type, metadata } = await req.json();

    if (!event_type) {
      return NextResponse.json({ error: 'event_type is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('marketing_events')
      .insert([{
        user_id: user.id,
        event_type,
        metadata: metadata || {}
      }]);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Tracking Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
