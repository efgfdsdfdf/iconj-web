// ICONJ Server-Side Analytics Library
// Provides functions for recording analytics events with idempotency

import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ==========================================
// TYPES
// ==========================================
export type AnalyticsEventType =
  | 'page_view'
  | 'product_view'
  | 'category_view'
  | 'search'
  | 'customization_started'
  | 'customization_completed'
  | 'quote_requested'
  | 'quote_viewed'
  | 'quote_accepted'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'checkout_started'
  | 'checkout_abandoned'
  | 'payment_started'
  | 'payment_completed'
  | 'order_created'
  | 'purchase'
  | 'wishlist_added'
  | 'wishlist_removed'
  | 'marketing_opt_in'
  | 'email_click'
  | 'campaign_click'
  | 'coupon_applied'
  | 'review_submitted';

export interface TrackEventParams {
  eventType: AnalyticsEventType | string;
  sessionId: string;
  userId?: string | null;
  properties?: Record<string, any>;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  utmTerm?: string | null;
  referrer?: string | null;
  device?: string | null;
  idempotencyKey?: string | null;
}

// ==========================================
// TRACK EVENT (Server-side, duplicate-safe)
// ==========================================
export async function trackEvent(params: TrackEventParams): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('analytics_events')
      .insert({
        session_id: params.sessionId,
        user_id: params.userId || null,
        event_type: params.eventType,
        properties: params.properties || {},
        utm_source: params.utmSource || null,
        utm_medium: params.utmMedium || null,
        utm_campaign: params.utmCampaign || null,
        utm_content: params.utmContent || null,
        utm_term: params.utmTerm || null,
        referrer: params.referrer || null,
        device: params.device || null,
        idempotency_key: params.idempotencyKey || null,
      });

    if (error) {
      // 23505 = unique_violation (idempotency_key duplicate) — this is expected, not an error
      if (error.code === '23505') {
        return true; // Already recorded, idempotent success
      }
      console.error('[Analytics] trackEvent error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Analytics] trackEvent exception:', err);
    return false;
  }
}

// ==========================================
// UPSERT SESSION
// ==========================================
export async function upsertSession(params: {
  sessionId: string;
  userId?: string | null;
  firstTouchSource?: string | null;
  firstTouchMedium?: string | null;
  firstTouchCampaign?: string | null;
  lastTouchSource?: string | null;
  lastTouchMedium?: string | null;
  lastTouchCampaign?: string | null;
  landingPage?: string | null;
  device?: string | null;
}): Promise<boolean> {
  try {
    // Try insert first; if session already exists, just update last_activity and last_touch
    const { data: existing } = await supabaseAdmin
      .from('visitor_sessions')
      .select('id')
      .eq('session_id', params.sessionId)
      .maybeSingle();

    if (existing) {
      // Session exists — update last touch and activity
      const updateData: Record<string, any> = {
        last_activity_at: new Date().toISOString(),
      };
      if (params.userId) updateData.user_id = params.userId;
      if (params.lastTouchSource) updateData.last_touch_source = params.lastTouchSource;
      if (params.lastTouchMedium) updateData.last_touch_medium = params.lastTouchMedium;
      if (params.lastTouchCampaign) updateData.last_touch_campaign = params.lastTouchCampaign;

      await supabaseAdmin
        .from('visitor_sessions')
        .update(updateData)
        .eq('session_id', params.sessionId);
    } else {
      // New session
      await supabaseAdmin.from('visitor_sessions').insert({
        session_id: params.sessionId,
        user_id: params.userId || null,
        first_touch_source: params.firstTouchSource || null,
        first_touch_medium: params.firstTouchMedium || null,
        first_touch_campaign: params.firstTouchCampaign || null,
        last_touch_source: params.lastTouchSource || params.firstTouchSource || null,
        last_touch_medium: params.lastTouchMedium || params.firstTouchMedium || null,
        last_touch_campaign: params.lastTouchCampaign || params.firstTouchCampaign || null,
        landing_page: params.landingPage || null,
        device: params.device || null,
      });
    }
    return true;
  } catch (err) {
    console.error('[Analytics] upsertSession exception:', err);
    return false;
  }
}

// ==========================================
// UPDATE PROFILE ATTRIBUTION (first-touch only, never overwrite)
// ==========================================
export async function setProfileFirstTouch(
  userId: string,
  source: string | null,
  medium: string | null,
  campaign: string | null
): Promise<void> {
  try {
    // Only set if first_touch_source is currently null
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('first_touch_source')
      .eq('id', userId)
      .maybeSingle();

    if (profile && !profile.first_touch_source && source) {
      await supabaseAdmin
        .from('profiles')
        .update({
          first_touch_source: source,
          first_touch_medium: medium,
          first_touch_campaign: campaign,
        })
        .eq('id', userId);
    }
  } catch (err) {
    console.error('[Analytics] setProfileFirstTouch exception:', err);
  }
}

// ==========================================
// FREEZE ATTRIBUTION SNAPSHOT ON ORDER
// ==========================================
export async function freezeOrderAttribution(
  orderId: string,
  sessionId: string,
  userId?: string | null
): Promise<void> {
  try {
    // Gather session data
    const { data: session } = await supabaseAdmin
      .from('visitor_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle();

    // Gather profile first-touch
    let profileAttribution: Record<string, any> = {};
    if (userId) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('first_touch_source, first_touch_medium, first_touch_campaign')
        .eq('id', userId)
        .maybeSingle();
      if (profile) {
        profileAttribution = {
          first_touch_source: profile.first_touch_source,
          first_touch_medium: profile.first_touch_medium,
          first_touch_campaign: profile.first_touch_campaign,
        };
      }
    }

    const snapshot = {
      session_id: sessionId,
      ...profileAttribution,
      session_first_touch_source: session?.first_touch_source || null,
      session_first_touch_medium: session?.first_touch_medium || null,
      session_first_touch_campaign: session?.first_touch_campaign || null,
      session_last_touch_source: session?.last_touch_source || null,
      session_last_touch_medium: session?.last_touch_medium || null,
      session_last_touch_campaign: session?.last_touch_campaign || null,
      landing_page: session?.landing_page || null,
      device: session?.device || null,
      captured_at: new Date().toISOString(),
    };

    await supabaseAdmin
      .from('orders')
      .update({ attribution_snapshot: snapshot })
      .eq('id', orderId);
  } catch (err) {
    console.error('[Analytics] freezeOrderAttribution exception:', err);
  }
}

// ==========================================
// INCREMENT PROFILE STATS (after purchase)
// ==========================================
export async function incrementProfileStats(
  userId: string,
  orderAmount: number
): Promise<void> {
  try {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('total_spent, order_count')
      .eq('id', userId)
      .maybeSingle();

    if (profile) {
      await supabaseAdmin
        .from('profiles')
        .update({
          total_spent: (Number(profile.total_spent) || 0) + orderAmount,
          order_count: (Number(profile.order_count) || 0) + 1,
          last_order_at: new Date().toISOString(),
        })
        .eq('id', userId);
    }
  } catch (err) {
    console.error('[Analytics] incrementProfileStats exception:', err);
  }
}

// ==========================================
// HELPER: Extract UTM from URL search params
// ==========================================
export function extractUtmParams(searchParams: URLSearchParams) {
  return {
    utmSource: searchParams.get('utm_source'),
    utmMedium: searchParams.get('utm_medium'),
    utmCampaign: searchParams.get('utm_campaign'),
    utmContent: searchParams.get('utm_content'),
    utmTerm: searchParams.get('utm_term'),
  };
}

// ==========================================
// HELPER: Detect source from referrer
// ==========================================
export function detectSourceFromReferrer(referrer: string | null): { source: string; medium: string } {
  if (!referrer) return { source: 'direct', medium: 'none' };

  const url = referrer.toLowerCase();
  if (url.includes('google.com') || url.includes('google.co'))
    return { source: 'google', medium: 'organic' };
  if (url.includes('instagram.com') || url.includes('l.instagram.com'))
    return { source: 'instagram', medium: 'social' };
  if (url.includes('facebook.com') || url.includes('fb.com') || url.includes('l.facebook.com'))
    return { source: 'facebook', medium: 'social' };
  if (url.includes('tiktok.com'))
    return { source: 'tiktok', medium: 'social' };
  if (url.includes('twitter.com') || url.includes('x.com') || url.includes('t.co'))
    return { source: 'twitter', medium: 'social' };
  if (url.includes('wa.me') || url.includes('whatsapp.com'))
    return { source: 'whatsapp', medium: 'social' };
  if (url.includes('youtube.com'))
    return { source: 'youtube', medium: 'social' };
  if (url.includes('pinterest.com'))
    return { source: 'pinterest', medium: 'social' };
  if (url.includes('bing.com'))
    return { source: 'bing', medium: 'organic' };

  // Generic referral
  try {
    const hostname = new URL(referrer).hostname;
    return { source: hostname, medium: 'referral' };
  } catch {
    return { source: 'unknown', medium: 'referral' };
  }
}
