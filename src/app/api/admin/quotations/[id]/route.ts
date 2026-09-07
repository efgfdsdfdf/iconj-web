import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdmin } from '@/lib/auth/admin';
import { computeNextAction, computePriority, logQuotationEvent, isPostPaymentLocked, createPostPaymentException } from '@/lib/quotation-helpers';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ─── GET /api/admin/quotations/[id] ──────────────────────────────────────────
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminAuth = await verifyAdmin();
  if (!adminAuth.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  // Admin gets ALL fields, no stripping
  const { data: quotation, error } = await supabaseAdmin
    .from('quotations')
    .select('*, products(variants)')
    .eq('id', id)
    .single();

  if (error || !quotation) return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });

  // Fetch exceptions
  const { data: exceptions } = await supabaseAdmin
    .from('quotation_exceptions')
    .select('*, products(variants)')
    .eq('quotation_id', id)
    .order('created_at', { ascending: false });

  // Fetch timeline
  const { data: events } = await supabaseAdmin
    .from('quotation_events')
    .select('*, products(variants)')
    .eq('quotation_id', id)
    .order('created_at', { ascending: false });

  // Fetch emails
  const { data: emails } = await supabaseAdmin
    .from('quotation_emails')
    .select('*, products(variants)')
    .eq('quotation_id', id)
    .order('created_at', { ascending: false });

  return NextResponse.json({
    quotation,
    exceptions: exceptions || [],
    events: events || [],
    emails: emails || [],
  });
}

// ─── PATCH /api/admin/quotations/[id] ────────────────────────────────────────
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminAuth = await verifyAdmin();
  if (!adminAuth.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const updates = await request.json();

  const { data: current, error } = await supabaseAdmin
    .from('quotations')
    .select('*, products(variants)')
    .eq('id', id)
    .single();

  if (error || !current) return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });

  // SAFEGUARD 8: Post-payment protection
  const locked = isPostPaymentLocked(current);

  if (locked) {
    // If locked, block any changes to customer price or specs
    if (
      updates.customer_price !== undefined ||
      updates.customer_shipping !== undefined ||
      updates.customer_total !== undefined
    ) {
      return NextResponse.json({
        error: 'Price is locked after payment. Create a post-payment exception to handle pricing issues.'
      }, { status: 400 });
    }
    if (updates.specifications !== undefined) {
      return NextResponse.json({
        error: 'Specifications are locked after payment. Create a post-payment exception to handle specification changes.'
      }, { status: 400 });
    }

    // If supplier cost changes after payment, don't silently update it. Create an exception instead.
    if (
      updates.supplier_total_cost !== undefined &&
      Number(updates.supplier_total_cost) !== Number(current.supplier_total_cost)
    ) {
      await createPostPaymentException(
        id,
        'SUPPLIER_PRICE_CHANGE',
        `Supplier cost changed from ${current.supplier_total_cost} to ${updates.supplier_total_cost} after customer payment.`,
        { supplier_total_cost: current.supplier_total_cost },
        { supplier_total_cost: updates.supplier_total_cost }
      );
      // We don't apply the update to the DB row so the original cost is preserved until exception is resolved
      delete updates.supplier_total_cost;
      delete updates.supplier_product_cost;
      delete updates.supplier_shipping_cost;
      delete updates.supplier_customization_cost;
      delete updates.supplier_other_charges;
    }
  }

  // Prevent modifying critical system fields
  const safeUpdates = { ...updates };
  delete safeUpdates.id;
  delete safeUpdates.reference;
  delete safeUpdates.access_token;
  delete safeUpdates.payment_status;
  delete safeUpdates.payment_reference;
  delete safeUpdates.converted_order_id;

  // Auto-calculate next_action and priority based on the updated state
  const mergedState = { ...current, ...safeUpdates };
  safeUpdates.next_action = computeNextAction(mergedState);
  safeUpdates.priority = computePriority(mergedState);

  const { data: updated, error: updateError } = await supabaseAdmin
    .from('quotations')
    .update(safeUpdates)
    .eq('id', id)
    .select()
    .single();

  if (updateError || !updated) {
    console.error('Failed to update quotation:', updateError);
    return NextResponse.json({ error: 'Failed to update quotation' }, { status: 500 });
  }

  // Log significant changes
  if (updates.status && updates.status !== current.status) {
    await logQuotationEvent(id, 'STATUS_CHANGED', `Status updated to ${updates.status}`, 'admin');
  } else if (Object.keys(updates).length > 0) {
    // Only log if we actually updated something else
    // e.g. supplier response saved
    if (updates.supplier_total_cost !== undefined && current.supplier_total_cost === null) {
      await logQuotationEvent(id, 'SUPPLIER_RESPONSE_SAVED', 'Supplier cost response recorded', 'admin');
    } else {
      await logQuotationEvent(id, 'QUOTATION_UPDATED', 'Quotation details updated by admin', 'admin');
    }
  }

  return NextResponse.json({ success: true, quotation: updated });
}
