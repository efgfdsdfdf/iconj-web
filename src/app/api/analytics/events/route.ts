import { NextResponse } from 'next/server';
import { trackEvent, upsertSession, setProfileFirstTouch, detectSourceFromReferrer } from '@/lib/analytics';
import { createClient } from '@/lib/supabase/server';

// POST /api/analytics/events
// Accepts tracking events from the client-side AnalyticsProvider
// Supports both guests (via sessionId) and logged-in users
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      eventType,
      sessionId,
      properties,
      utmSource,
      utmMedium,
      utmCampaign,
      utmContent,
      utmTerm,
      referrer,
      device,
      idempotencyKey,
      landingPage,
    } = body;

    if (!eventType || !sessionId) {
      return NextResponse.json(
        { error: 'eventType and sessionId are required' },
        { status: 400 }
      );
    }

    // Try to get logged-in user (optional — guests are tracked too)
    let userId: string | null = null;
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id || null;
    } catch {
      // Guest user — that's fine
    }

    // Detect source from referrer if no UTM provided
    const detected = detectSourceFromReferrer(referrer || null);
    const finalSource = utmSource || detected.source;
    const finalMedium = utmMedium || detected.medium;

    // Upsert visitor session
    await upsertSession({
      sessionId,
      userId,
      firstTouchSource: finalSource,
      firstTouchMedium: finalMedium,
      firstTouchCampaign: utmCampaign || null,
      lastTouchSource: finalSource,
      lastTouchMedium: finalMedium,
      lastTouchCampaign: utmCampaign || null,
      landingPage: landingPage || null,
      device: device || null,
    });

    // Set profile first-touch attribution (only if not already set)
    if (userId && finalSource) {
      await setProfileFirstTouch(userId, finalSource, finalMedium, utmCampaign || null);
    }

    // Record the event
    await trackEvent({
      eventType,
      sessionId,
      userId,
      properties,
      utmSource: finalSource,
      utmMedium: finalMedium,
      utmCampaign: utmCampaign || null,
      utmContent: utmContent || null,
      utmTerm: utmTerm || null,
      referrer: referrer || null,
      device: device || null,
      idempotencyKey: idempotencyKey || null,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Analytics API] Error:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
