import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { computeNextAction, computePriority, logQuotationEvent } from '@/lib/quotation-helpers';
import {
  sendQuoteReminder1,
  sendQuoteReminder2,
  sendQuoteExpiredEmails,
} from '@/lib/quotation-emails';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

/**
 * GET /api/cron/quotation-reminders
 *
 * Called by cron-job.org every 6 hours.
 * Handles:
 * 1. Reminder 1 — 24h after quote sent, not yet accepted
 * 2. Reminder 2 — 2 days before expiry
 * 3. Expiry — quote_valid_until passed
 *
 * All operations are idempotent (timestamp checks prevent double-send).
 */
export async function GET(request: Request) {
  // Authenticate cron call
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const now = new Date();
  const results = {
    reminder1Sent: 0,
    reminder2Sent: 0,
    expired: 0,
    errors: [] as string[],
  };

  // ── Fetch all active quotations in reminder-relevant states ───────────────
  const { data: quotations, error } = await supabaseAdmin
    .from('quotations')
    .select('*')
    .in('status', ['QUOTE_SENT', 'QUOTE_VIEWED'])
    .is('quote_expired_at', null);

  if (error) {
    console.error('Cron: Failed to fetch quotations:', error);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }

  // ── Get reminder settings ─────────────────────────────────────────────────
  const { data: settings } = await supabaseAdmin
    .from('store_settings')
    .select('id, value')
    .in('id', ['quote_reminder_1_hours', 'quote_reminder_2_days_before_expiry']);

  const settingsMap: Record<string, string> = {};
  (settings || []).forEach((s: any) => { settingsMap[s.id] = s.value; });

  const reminder1Hours = parseInt(settingsMap['quote_reminder_1_hours'] || '24');
  const reminder2DaysBefore = parseInt(settingsMap['quote_reminder_2_days_before_expiry'] || '2');

  for (const q of quotations || []) {
    try {
      const quoteSentAt = q.quote_sent_at ? new Date(q.quote_sent_at) : null;
      const quoteValidUntil = q.quote_valid_until ? new Date(q.quote_valid_until) : null;

      // ── 1. Check for expiry FIRST ──────────────────────────────────────
      if (quoteValidUntil && now > quoteValidUntil) {
        await supabaseAdmin
          .from('quotations')
          .update({
            status: 'QUOTE_EXPIRED',
            quote_expired_at: now.toISOString(),
            priority: 'NO_ACTION',
            next_action: 'Quote expired — contact customer to create new quotation if needed',
          })
          .eq('id', q.id);

        await logQuotationEvent(q.id, 'QUOTE_EXPIRED', 'Quote validity period ended — automatically expired by system', 'system');
        await sendQuoteExpiredEmails(q);
        results.expired++;
        continue; // Don't send reminders for expired quotes
      }

      // ── 2. Reminder 1: 24h after quote_sent, not yet reminded ─────────
      if (
        quoteSentAt &&
        !q.reminder_1_sent_at &&
        (now.getTime() - quoteSentAt.getTime()) >= reminder1Hours * 60 * 60 * 1000
      ) {
        const emailResult = await sendQuoteReminder1(q);
        if (emailResult.success && !emailResult.alreadySent) {
          await supabaseAdmin
            .from('quotations')
            .update({ reminder_1_sent_at: now.toISOString() })
            .eq('id', q.id);
          await logQuotationEvent(q.id, 'REMINDER_1_SENT', 'Automated reminder 1 sent to customer', 'system');
          results.reminder1Sent++;
        }
      }

      // ── 3. Reminder 2: X days before expiry ───────────────────────────
      if (
        quoteValidUntil &&
        !q.reminder_2_sent_at &&
        !q.reminder_1_sent_at // Don't send reminder 2 before reminder 1
      ) {
        const expiryMsAway = quoteValidUntil.getTime() - now.getTime();
        const triggerMs = reminder2DaysBefore * 24 * 60 * 60 * 1000;

        if (expiryMsAway <= triggerMs && expiryMsAway > 0) {
          const emailResult = await sendQuoteReminder2(q);
          if (emailResult.success && !emailResult.alreadySent) {
            await supabaseAdmin
              .from('quotations')
              .update({ reminder_2_sent_at: now.toISOString() })
              .eq('id', q.id);
            await logQuotationEvent(q.id, 'REMINDER_2_SENT', 'Automated expiry reminder sent to customer', 'system');
            results.reminder2Sent++;
          }
        }
      }

    } catch (err: any) {
      console.error(`Cron: Error processing quotation ${q.id}:`, err.message);
      results.errors.push(`${q.reference}: ${err.message}`);
    }
  }

  console.log('Quotation reminders cron completed:', results);
  return NextResponse.json({ success: true, ...results, processedAt: now.toISOString() });
}
