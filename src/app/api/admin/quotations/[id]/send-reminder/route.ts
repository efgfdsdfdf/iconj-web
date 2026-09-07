import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdmin } from '@/lib/auth/admin';
import { logQuotationEvent } from '@/lib/quotation-helpers';
import { sendQuoteReminder1 } from '@/lib/quotation-emails';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// POST /api/admin/quotations/[id]/send-reminder
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminError = await verifyAdmin();
  if (adminError) return adminError;

  const { id } = await params;

  const { data: quotation } = await supabaseAdmin
    .from('quotations')
    .select('*')
    .eq('id', id)
    .single();

  if (!quotation) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (!['QUOTE_SENT', 'QUOTE_VIEWED'].includes(quotation.status)) {
    return NextResponse.json({ error: 'Cannot send reminder for this status' }, { status: 400 });
  }

  // Throttle: don't allow manual reminders more than once every 12 hours
  if (quotation.reminder_1_sent_at) {
    const lastSent = new Date(quotation.reminder_1_sent_at).getTime();
    const twelveHoursAgo = Date.now() - (12 * 60 * 60 * 1000);
    if (lastSent > twelveHoursAgo) {
      return NextResponse.json({ error: 'A reminder was sent recently. Please wait before sending another.' }, { status: 429 });
    }
  }

  await logQuotationEvent(id, 'MANUAL_REMINDER_SENT', 'Admin manually triggered a quotation reminder', 'admin');

  // We reuse the reminder 1 template for manual reminders
  const emailResult = await sendQuoteReminder1(quotation);

  if (emailResult.success) {
    await supabaseAdmin
      .from('quotations')
      .update({ reminder_1_sent_at: new Date().toISOString() })
      .eq('id', id);
  }

  return NextResponse.json({ success: emailResult.success });
}
