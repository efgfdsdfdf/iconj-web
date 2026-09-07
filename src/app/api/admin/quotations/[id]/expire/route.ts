import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdmin } from '@/lib/auth/admin';
import { logQuotationEvent } from '@/lib/quotation-helpers';
import { sendQuoteExpiredEmails } from '@/lib/quotation-emails';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// POST /api/admin/quotations/[id]/expire
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminAuth = await verifyAdmin();
  if (!adminAuth.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const { data: quotation } = await supabaseAdmin
    .from('quotations')
    .select('*')
    .eq('id', id)
    .single();

  if (!quotation) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (['QUOTE_EXPIRED', 'PAID', 'CONVERTED_TO_ORDER'].includes(quotation.status)) {
    return NextResponse.json({ error: 'Cannot expire quotation in current state' }, { status: 400 });
  }

  const { data: updated } = await supabaseAdmin
    .from('quotations')
    .update({ 
      status: 'QUOTE_EXPIRED', 
      quote_expired_at: new Date().toISOString(),
      priority: 'NO_ACTION',
      next_action: 'Quote manually expired — no action required'
    })
    .eq('id', id)
    .select()
    .single();

  await logQuotationEvent(id, 'MANUALLY_EXPIRED', 'Admin manually expired the quotation', 'admin');

  if (updated) {
    // Send expiration emails
    await sendQuoteExpiredEmails(updated).catch(err => console.error('Failed to send expiry emails:', err));
  }

  return NextResponse.json({ success: true, quotation: updated });
}
