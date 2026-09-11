import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { 
  sendWelcomeEmail, 
  sendAbandonedCartEmail, 
  sendBrowseAbandonedEmail,
  sendReviewRequestEmail,
  sendCampaignEmail
} from '@/lib/marketing-emails';

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
  const results = { 
    welcomeSent: 0, 
    abandonedCartSent: 0, 
    browseAbandonedSent: 0,
    reviewRequestsSent: 0,
    errors: [] as string[] 
  };

  try {
    const { data: activeFlows } = await supabaseAdmin.from('automation_flows').select('*').eq('is_active', true);
    
    // Default Fallbacks
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();

    // ==========================================
    // 1. WELCOME FLOW
    // ==========================================
    const { data: newProfiles } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, created_at, marketing_opt_in')
      .gte('created_at', oneDayAgo);

    if (newProfiles && newProfiles.length > 0) {
      const { data: sentEvents } = await supabaseAdmin
        .from('marketing_events')
        .select('user_id')
        .eq('event_type', 'EMAIL_SENT')
        .contains('metadata', { campaign: 'WELCOME' });
        
      const sentUserIds = new Set(sentEvents?.map(e => e.user_id) || []);

      for (const profile of newProfiles) {
        if (!sentUserIds.has(profile.id) && profile.marketing_opt_in !== false) {
          try {
            await sendWelcomeEmail({ email: profile.email, full_name: profile.full_name || '' });
            await supabaseAdmin.from('marketing_events').insert({
              user_id: profile.id,
              event_type: 'EMAIL_SENT',
              metadata: { campaign: 'WELCOME', target_email: profile.email }
            });
            results.welcomeSent++;
          } catch (e: any) {
            results.errors.push(`Welcome ${profile.email}: ${e.message}`);
          }
        }
      }
    }

    // ==========================================
    // 2. CART ABANDONMENT FLOW
    // ==========================================
    const cartFlow = activeFlows?.find((f: any) => f.trigger_event === 'abandoned_cart');
    
    // Only run if the flow exists and is active, or default to yes if none exist (for backwards compatibility)
    if (cartFlow !== null) {
      let waitHours = 2;
      let emailSubject = undefined;

      if (cartFlow) {
        const waitStep = cartFlow.steps?.find((s: any) => s.type === 'wait');
        const emailStep = cartFlow.steps?.find((s: any) => s.type === 'email');
        if (waitStep?.unit === 'hours') waitHours = Number(waitStep.value) || 2;
        if (emailStep?.subject) emailSubject = emailStep.subject;
      }

      const triggerTime = new Date(now.getTime() - waitHours * 60 * 60 * 1000).toISOString();
      // Only look for items added before the trigger time, up to 24h before
      const maxAgeTime = new Date(now.getTime() - (waitHours + 24) * 60 * 60 * 1000).toISOString();

      const { data: abandonedEvents } = await supabaseAdmin
        .from('marketing_events')
        .select('user_id, created_at')
        .eq('event_type', 'ADDED_TO_CART')
        .gte('created_at', maxAgeTime)
        .lte('created_at', triggerTime);

      if (abandonedEvents && abandonedEvents.length > 0) {
        const abandonedUserIds = [...new Set(abandonedEvents.map((e: any) => e.user_id))];

        for (const uid of abandonedUserIds) {
          const { data: purchaseEvents } = await supabaseAdmin
            .from('marketing_events')
            .select('id')
            .eq('user_id', uid)
            .eq('event_type', 'PURCHASE')
            .gte('created_at', maxAgeTime);

          const { data: alreadySent } = await supabaseAdmin
            .from('marketing_events')
            .select('id')
            .eq('user_id', uid)
            .eq('event_type', 'EMAIL_SENT')
            .contains('metadata', { campaign: 'ABANDONED_CART' })
            .gte('created_at', sevenDaysAgo);

          if ((!purchaseEvents || purchaseEvents.length === 0) && (!alreadySent || alreadySent.length === 0)) {
            const { data: profile } = await supabaseAdmin.from('profiles').select('email, full_name, marketing_opt_in').eq('id', uid).single();
            
            if (profile && profile.marketing_opt_in !== false) {
              try {
                await sendAbandonedCartEmail({ email: profile.email, full_name: profile.full_name || '' }, emailSubject);
                await supabaseAdmin.from('marketing_events').insert({
                  user_id: uid,
                  event_type: 'EMAIL_SENT',
                  metadata: { campaign: 'ABANDONED_CART' }
                });
                results.abandonedCartSent++;
              } catch (e: any) {
                results.errors.push(`Cart ${profile.email}: ${e.message}`);
              }
            }
          }
        }
      }
    }

    // ==========================================
    // 3. BROWSE ABANDONMENT FLOW
    // ==========================================
    // Users who viewed a product 2-24h ago
    const { data: viewEvents } = await supabaseAdmin
      .from('marketing_events')
      .select('user_id, metadata, created_at')
      .eq('event_type', 'VIEWED_PRODUCT')
      .gte('created_at', oneDayAgo)
      .lte('created_at', twoHoursAgo)
      .order('created_at', { ascending: false });

    if (viewEvents && viewEvents.length > 0) {
      // Group by user, keep most recent view
      const userLatestView = new Map();
      viewEvents.forEach(e => {
        if (!userLatestView.has(e.user_id)) {
          userLatestView.set(e.user_id, e);
        }
      });

      for (const [uid, event] of Array.from(userLatestView.entries())) {
        // Did they add to cart or purchase in last 24h?
        const { data: actionEvents } = await supabaseAdmin
          .from('marketing_events')
          .select('id')
          .eq('user_id', uid)
          .in('event_type', ['ADDED_TO_CART', 'PURCHASE'])
          .gte('created_at', oneDayAgo);

        // Already sent browse email in last 7 days?
        const { data: alreadySent } = await supabaseAdmin
          .from('marketing_events')
          .select('id')
          .eq('user_id', uid)
          .eq('event_type', 'EMAIL_SENT')
          .contains('metadata', { campaign: 'BROWSE_ABANDONMENT' })
          .gte('created_at', sevenDaysAgo);

        if ((!actionEvents || actionEvents.length === 0) && (!alreadySent || alreadySent.length === 0)) {
          const { data: profile } = await supabaseAdmin.from('profiles').select('email, full_name, marketing_opt_in').eq('id', uid).single();
          const productName = event.metadata?.name || 'product';
          
          if (profile && profile.marketing_opt_in !== false) {
            try {
              await sendBrowseAbandonedEmail({ email: profile.email, full_name: profile.full_name || '' }, productName);
              await supabaseAdmin.from('marketing_events').insert({
                user_id: uid,
                event_type: 'EMAIL_SENT',
                metadata: { campaign: 'BROWSE_ABANDONMENT', product: productName }
              });
              results.browseAbandonedSent++;
            } catch (e: any) {
              results.errors.push(`Browse ${profile.email}: ${e.message}`);
            }
          }
        }
      }
    }

    // ==========================================
    // 4. REVIEW REQUEST FLOW
    // ==========================================
    // Find orders delivered ~7-14 days ago. (Using order_status = DELIVERED as a proxy, 
    // assuming updated_at reflects delivery time roughly, or we just check DELIVERED orders)
    const { data: deliveredOrders } = await supabaseAdmin
      .from('orders')
      .select('id, user_id, updated_at')
      .eq('order_status', 'DELIVERED')
      .gte('updated_at', fourteenDaysAgo)
      .lte('updated_at', sevenDaysAgo);

    if (deliveredOrders && deliveredOrders.length > 0) {
      for (const order of deliveredOrders) {
        if (!order.user_id) continue;
        
        // Already sent review request for this order?
        const { data: alreadySent } = await supabaseAdmin
          .from('marketing_events')
          .select('id')
          .eq('user_id', order.user_id)
          .eq('event_type', 'EMAIL_SENT')
          .contains('metadata', { campaign: 'REVIEW_REQUEST', order_id: order.id });

        if (!alreadySent || alreadySent.length === 0) {
          const { data: profile } = await supabaseAdmin.from('profiles').select('email, full_name, marketing_opt_in').eq('id', order.user_id).single();
          
          if (profile && profile.marketing_opt_in !== false) {
            try {
              await sendReviewRequestEmail({ email: profile.email, full_name: profile.full_name || '' }, order.id);
              await supabaseAdmin.from('marketing_events').insert({
                user_id: order.user_id,
                event_type: 'EMAIL_SENT',
                metadata: { campaign: 'REVIEW_REQUEST', order_id: order.id }
              });
              results.reviewRequestsSent++;
            } catch (e: any) {
              results.errors.push(`Review ${profile.email}: ${e.message}`);
            }
          }
        }
      }
    }

    // ==========================================
    // 5. SEASONAL BROADCASTS (PHASE 3)
    // ==========================================
    const { data: scheduledCampaigns } = await supabaseAdmin
      .from('email_campaigns')
      .select('*')
      .eq('status', 'SCHEDULED')
      .lte('scheduled_for', now.toISOString());

    if (scheduledCampaigns && scheduledCampaigns.length > 0) {
      for (const camp of scheduledCampaigns) {
        try {
          // Fetch target users
          let profileQuery = supabaseAdmin.from('profiles').select('id, email, full_name, marketing_opt_in, total_spent');
          
          if (camp.target_audience === 'VIP') {
            profileQuery = profileQuery.gte('total_spent', 500000); // 500k NGN threshold for VIP
          } else if (camp.target_audience === 'NO_PURCHASE') {
            profileQuery = profileQuery.or('total_spent.eq.0,total_spent.is.null');
          }

          const { data: targets } = await profileQuery;
          
          if (targets && targets.length > 0) {
            for (const t of targets) {
              if (t.marketing_opt_in !== false) {
                await supabaseAdmin.from('marketing_events').insert({
                  user_id: t.id,
                  event_type: 'EMAIL_SENT',
                  metadata: { campaign: camp.id, type: 'BROADCAST' }
                });
                
                // Call Resend to actually deliver the HTML broadcast
                await sendCampaignEmail(t, camp.subject, camp.html_content);
                console.log(`Sending Broadcast '${camp.title}' to ${t.email}`);
              }
            }
          }
          
          // Mark campaign as sent
          await supabaseAdmin.from('email_campaigns').update({
            status: 'SENT',
            sent_at: now.toISOString()
          }).eq('id', camp.id);

        } catch (campErr: any) {
          results.errors.push(`Campaign ${camp.title}: ${campErr.message}`);
        }
      }
    }

  } catch (error: any) {
    console.error('Marketing Cron Error:', error);
    results.errors.push(error.message);
  }

  return NextResponse.json({ success: true, ...results });
}
