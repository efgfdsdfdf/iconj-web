import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdmin } from '@/lib/auth/admin';
import { logQuotationEvent, checkFulfillmentBlock } from '@/lib/quotation-helpers';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// PATCH /api/admin/quotations/[id]/exception/[eid]
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string, eid: string }> }) {
  const adminAuth = await verifyAdmin();
  if (!adminAuth.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, eid } = await params;
  const { status, resolution_note } = await request.json();

  if (!['RESOLVED', 'DISMISSED'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const { data: exception, error } = await supabaseAdmin
    .from('quotation_exceptions')
    .update({ 
      status, 
      resolution_note, 
      resolved_at: new Date().toISOString(),
      resolved_by: 'admin' // In a real app we'd get the admin email from session
    })
    .eq('id', eid)
    .eq('quotation_id', id)
    .select()
    .single();

  if (error || !exception) return NextResponse.json({ error: 'Exception not found or update failed' }, { status: 400 });

  await logQuotationEvent(id, 'EXCEPTION_RESOLVED', `Exception ${exception.exception_type} marked as ${status}`, 'admin', { resolution_note });

  // SAFEGUARD 6: Check if we can unblock fulfillment
  const { blocked } = await checkFulfillmentBlock(id);

  // If no more open exceptions, clear the is_exception flag as well
  if (!blocked) {
    await supabaseAdmin
      .from('quotations')
      .update({ is_exception: false })
      .eq('id', id);
  }

  return NextResponse.json({ success: true, exception, blocked });
}
