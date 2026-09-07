import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdmin } from '@/lib/auth/admin';
import { logQuotationEvent } from '@/lib/quotation-helpers';
import { sendQuoteSentEmail } from '@/lib/quotation-emails';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// POST /api/admin/quotations/[id]/send-quote
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminError = await verifyAdmin();
  if (adminError) return adminError;

  const { id } = await params;

  const { data: quotation, error } = await supabaseAdmin
    .from('quotations')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !quotation) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // IDEMPOTENCY: Check if already sent (unless force resend flag is passed)
  const body = await request.json().catch(() => ({}));
  const isResend = !!body.resend;

  if (quotation.quote_sent_at && !isResend) {
    return NextResponse.json({ success: true, alreadySent: true });
  }

  // Validate state
  if (!quotation.customer_price || !quotation.customer_total) {
    return NextResponse.json({ error: 'Cannot send quote without customer pricing calculated' }, { status: 400 });
  }
  if (!quotation.quote_valid_until) {
    return NextResponse.json({ error: 'Cannot send quote without validity date' }, { status: 400 });
  }

  const now = new Date().toISOString();

  const { data: updated } = await supabaseAdmin
    .from('quotations')
    .update({
      status: 'QUOTE_SENT',
      quote_sent_at: quotation.quote_sent_at || now, // Keep original sent date on resend
      next_action: 'NO ACTION REQUIRED — SYSTEM WILL REMIND CUSTOMER AUTOMATICALLY',
      priority: 'NO_ACTION'
    })
    .eq('id', id)
    .select()
    .single();

  if (!updated) {
    return NextResponse.json({ error: 'Failed to update quotation state' }, { status: 500 });
  }

  await logQuotationEvent(
    id, 
    isResend ? 'QUOTE_RESENT' : 'QUOTE_SENT', 
    isResend ? 'Quotation email manually resent to customer' : 'Quotation sent to customer', 
    'admin'
  );

  // Send email asynchronously
  sendQuoteSentEmail(updated).catch(err => 
    console.error('Failed to send quote email:', err)
  );

  return NextResponse.json({ success: true, quotation: updated });
}
