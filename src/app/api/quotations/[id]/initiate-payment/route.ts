import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { logQuotationEvent } from '@/lib/quotation-helpers';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

/**
 * POST /api/quotations/[id]/initiate-payment
 *
 * SAFEGUARD 3 & 4:
 * - Verifies quotation is in QUOTE_ACCEPTED status
 * - Verifies payment_deadline has not passed (SAFEGUARD 4)
 * - Initializes Paystack with the server-verified customer_total amount
 * - Never trusts client-supplied amounts
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: quotation } = await supabaseAdmin
    .from('quotations')
    .select('*')
    .eq('id', id)
    .single();

  if (!quotation) return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });

  // Auth check
  const url = new URL(request.url);
  const tokenParam = url.searchParams.get('token');
  let userId: string | null = null;
  try {
    const cookieStore = await cookies();
    const sc = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      cookies: { getAll: () => cookieStore.getAll() }
    });
    const { data: { user } } = await sc.auth.getUser();
    userId = user?.id || null;
  } catch {}

  const isOwner = (userId && quotation.user_id === userId) || (tokenParam && quotation.access_token === tokenParam);
  if (!isOwner) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  // Must be QUOTE_ACCEPTED
  if (quotation.status !== 'QUOTE_ACCEPTED' && quotation.status !== 'PAYMENT_PENDING') {
    return NextResponse.json({
      error: `Quotation must be accepted before payment. Current status: ${quotation.status}`,
    }, { status: 400 });
  }

  // Already paid — return success
  if (quotation.payment_status === 'PAID') {
    return NextResponse.json({ error: 'This quotation has already been paid' }, { status: 400 });
  }

  // SAFEGUARD 4: Check payment deadline
  if (quotation.payment_deadline && new Date(quotation.payment_deadline) < new Date()) {
    await supabaseAdmin
      .from('quotations')
      .update({ status: 'QUOTE_EXPIRED', quote_expired_at: new Date().toISOString(), priority: 'NO_ACTION', next_action: 'Quote expired — contact customer to create new quotation if needed' })
      .eq('id', id);
    await logQuotationEvent(id, 'QUOTE_EXPIRED_AFTER_ACCEPTANCE', 'Payment deadline passed — quotation expired', 'system');
    return NextResponse.json({
      error: 'The payment deadline for this quotation has passed. Please contact ICONJ to arrange a new quotation.',
    }, { status: 410 });
  }

  // Verify customer_total is set (server-side amount — never from client)
  if (!quotation.customer_total || Number(quotation.customer_total) <= 0) {
    return NextResponse.json({ error: 'Invalid quotation amount' }, { status: 400 });
  }

  const amountKobo = Math.round(Number(quotation.customer_total) * 100);

  // Initialize Paystack transaction
  const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: quotation.customer_email,
      amount: amountKobo,
      currency: 'NGN',
      callback_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://iconj.com.ng'}/account/quotations/${id}?payment=done`,
      metadata: {
        quotation_id: id,
        quotation_reference: quotation.reference,
        customer_name: quotation.customer_name,
        custom_fields: [
          { display_name: 'Quotation Reference', variable_name: 'quotation_reference', value: quotation.reference },
          { display_name: 'Product', variable_name: 'product_name', value: quotation.product_name },
        ],
      },
    }),
  });

  const paystackData = await paystackResponse.json();

  if (!paystackData.status || !paystackData.data?.authorization_url) {
    console.error('Paystack initialization failed:', paystackData);
    return NextResponse.json({ error: 'Failed to initialize payment. Please try again.' }, { status: 500 });
  }

  // Mark as payment pending
  await supabaseAdmin
    .from('quotations')
    .update({ status: 'PAYMENT_PENDING', next_action: 'NO ACTION REQUIRED — WAITING FOR PAYMENT CONFIRMATION' })
    .eq('id', id);

  return NextResponse.json({
    success: true,
    payment_url: paystackData.data.authorization_url,
    reference: paystackData.data.reference,
  });
}
