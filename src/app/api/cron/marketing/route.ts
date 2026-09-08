import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const now = new Date();
  const results = { welcomeSent: 0, abandonedCartSent: 0, errors: [] as string[] };

  try {
    // 1. WELCOME FLOW (Phase 1)
    // Find profiles created in the last 24h that haven't received a WELCOME email.
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    
    // Get recent profiles
    const { data: newProfiles } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, created_at')
      .gte('created_at', oneDayAgo);

    if (newProfiles && newProfiles.length > 0) {
      // Get who already received it
      const { data: sentEvents } = await supabaseAdmin
        .from('marketing_events')
        .select('user_id')
        .eq('event_type', 'EMAIL_SENT')
        .contains('metadata', { campaign: 'WELCOME' });
        
      const sentUserIds = new Set(sentEvents?.map(e => e.user_id) || []);

      for (const profile of newProfiles) {
        if (!sentUserIds.has(profile.id)) {
          // Send Welcome Email (Placeholder for Resend API call)
          console.log(`Sending Welcome Email to ${profile.email}`);
          
          await supabaseAdmin.from('marketing_events').insert({
            user_id: profile.id,
            event_type: 'EMAIL_SENT',
            metadata: { campaign: 'WELCOME', target_email: profile.email }
          });
          results.welcomeSent++;
        }
      }
    }

    // 2. CART ABANDONMENT FLOW (Phase 1)
    // Find ADDED_TO_CART events in the last 2-24 hours.
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
    
    // We get unique user_ids who abandoned cart
    const { data: abandonedEvents } = await supabaseAdmin
      .from('marketing_events')
      .select('user_id, created_at')
      .eq('event_type', 'ADDED_TO_CART')
      .gte('created_at', oneDayAgo)
      .lte('created_at', twoHoursAgo);

    if (abandonedEvents && abandonedEvents.length > 0) {
      const abandonedUserIds = [...new Set(abandonedEvents.map(e => e.user_id))];

      for (const uid of abandonedUserIds) {
        // Did they purchase AFTER they added to cart?
        const { data: purchaseEvents } = await supabaseAdmin
          .from('marketing_events')
          .select('id')
          .eq('user_id', uid)
          .eq('event_type', 'PURCHASE')
          .gte('created_at', oneDayAgo);

        // Did we already send an abandoned cart email in the last 24h?
        const { data: alreadySent } = await supabaseAdmin
          .from('marketing_events')
          .select('id')
          .eq('user_id', uid)
          .eq('event_type', 'EMAIL_SENT')
          .contains('metadata', { campaign: 'ABANDONED_CART' })
          .gte('created_at', oneDayAgo);

        if ((!purchaseEvents || purchaseEvents.length === 0) && (!alreadySent || alreadySent.length === 0)) {
          // Send Abandoned Cart Email (Placeholder for Resend API call)
          console.log(`Sending Abandoned Cart Email to user ${uid}`);
          
          await supabaseAdmin.from('marketing_events').insert({
            user_id: uid,
            event_type: 'EMAIL_SENT',
            metadata: { campaign: 'ABANDONED_CART' }
          });
          results.abandonedCartSent++;
        }
      }
    }

  } catch (error: any) {
    console.error('Marketing Cron Error:', error);
    results.errors.push(error.message);
  }

  return NextResponse.json({ success: true, ...results });
}
