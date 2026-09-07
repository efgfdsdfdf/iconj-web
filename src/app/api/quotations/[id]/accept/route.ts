import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { logQuotationEvent, getPaymentGraceHours } from '@/lib/quotation-helpers';
import { sendQuoteAcceptedEmails } from '@/lib/quotation-emails';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function getAuthorizedUser(request: Request): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const supabaseClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );
    const { data: { user } } = await supabaseClient.auth.getUser();
    return user?.id || null;
  } catch { return null; }
}

// ─── POST /api/quotations/[id]/accept ────────────────────────────────────────
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data: quotation, error } = await supabaseAdmin
    .from('quotations')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !quotation) return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });

  // Authorization: owner only (guests must use token param)
  const url = new URL(request.url);
  const tokenParam = url.searchParams.get('token');
  const userId = await getAuthorizedUser(request);
  const isOwner = (userId && quotation.user_id === userId) || (tokenParam && quotation.access_token === tokenParam);
  if (!isOwner) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  // IDEMPOTENCY: Already accepted — return success without double-sending
  if (quotation.quote_accepted_at) {
    return NextResponse.json({ success: true, alreadyAccepted: true, payment_deadline: quotation.payment_deadline });
  }

  // Must be in QUOTE_SENT or QUOTE_VIEWED status
  if (!['QUOTE_SENT', 'QUOTE_VIEWED'].includes(quotation.status)) {
    return NextResponse.json({ error: `Quotation is not in an acceptable state (current: ${quotation.status})` }, { status: 400 });
  }

  // SAFEGUARD 4: Payment deadline = quote_valid_until + grace period
  const graceHours = await getPaymentGraceHours();
  const paymentDeadline = quotation.quote_valid_until
    ? new Date(new Date(quotation.quote_valid_until).getTime() + graceHours * 60 * 60 * 1000).toISOString()
    : null;

  const now = new Date().toISOString();

  await supabaseAdmin
    .from('quotations')
    .update({
      status: 'QUOTE_ACCEPTED',
      quote_accepted_at: now,
      payment_deadline: paymentDeadline,
      priority: 'NO_ACTION',
      next_action: 'NO ACTION REQUIRED — WAITING FOR CUSTOMER PAYMENT',
    })
    .eq('id', id);

  await logQuotationEvent(id, 'QUOTE_ACCEPTED', 'Customer accepted the quotation', 'customer');

  // Send acceptance emails
  sendQuoteAcceptedEmails({ ...quotation, status: 'QUOTE_ACCEPTED', quote_accepted_at: now, payment_deadline: paymentDeadline })
    .catch(err => console.error('Failed to send acceptance emails:', err));

  return NextResponse.json({ success: true, payment_deadline: paymentDeadline });
}
