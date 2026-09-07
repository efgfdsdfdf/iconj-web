import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdmin } from '@/lib/auth/admin';
import { logQuotationEvent } from '@/lib/quotation-helpers';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// POST /api/admin/quotations/[id]/fulfillment
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminAuth = await verifyAdmin();
  if (!adminAuth.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { action, reference } = await request.json(); // action: 'mark_submitted' | 'add_tracking'

  const { data: quotation } = await supabaseAdmin
    .from('quotations')
    .select('*')
    .eq('id', id)
    .single();

  if (!quotation) return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });

  // SAFEGUARD 6: Blocked by exception
  if (quotation.fulfillment_blocked) {
    return NextResponse.json({ error: 'Fulfillment is blocked by an unresolved exception.' }, { status: 400 });
  }

  // SAFEGUARD 5: Explicit fulfillment tracking
  if (action === 'mark_submitted') {
    if (quotation.supplier_fulfillment_status !== 'NOT_SUBMITTED') {
      return NextResponse.json({ error: 'Already submitted' }, { status: 400 });
    }

    const now = new Date().toISOString();
    await supabaseAdmin
      .from('quotations')
      .update({
        supplier_fulfillment_status: 'SUBMITTED',
        supplier_fulfillment_sent_at: now,
        supplier_fulfillment_sent_by: 'admin',
        next_action: 'Order created — manage in the Orders section', // Return to normal order lifecycle
        priority: 'NO_ACTION'
      })
      .eq('id', id);

    await logQuotationEvent(id, 'FULFILLMENT_SUBMITTED', 'Supplier fulfillment order was marked as submitted by admin', 'admin');

    return NextResponse.json({ success: true });
  }

  if (action === 'add_tracking') {
    if (!reference) return NextResponse.json({ error: 'Reference required' }, { status: 400 });

    await supabaseAdmin
      .from('quotations')
      .update({
        supplier_fulfillment_status: 'CONFIRMED',
        supplier_fulfillment_reference: reference,
        supplier_fulfillment_confirmed_at: new Date().toISOString()
      })
      .eq('id', id);

    await logQuotationEvent(id, 'FULFILLMENT_CONFIRMED', `Supplier fulfillment confirmed (ref: ${reference})`, 'admin', { reference });

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
