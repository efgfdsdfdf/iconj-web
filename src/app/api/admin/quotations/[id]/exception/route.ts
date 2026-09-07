import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdmin } from '@/lib/auth/admin';
import { createPostPaymentException } from '@/lib/quotation-helpers';
import { sendSpecIssueAdmin } from '@/lib/quotation-emails';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// POST /api/admin/quotations/[id]/exception
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminAuth = await verifyAdmin();
  if (!adminAuth.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { type, description, old_value, new_value } = await request.json();

  if (!type || !description) {
    return NextResponse.json({ error: 'Type and description are required' }, { status: 400 });
  }

  const { data: quotation } = await supabaseAdmin
    .from('quotations')
    .select('*')
    .eq('id', id)
    .single();

  if (!quotation) return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });

  await createPostPaymentException(id, type, description, old_value, new_value);

  // If this was manually flagged before payment during supplier response
  if (type === 'SPEC_CONFLICT' && quotation.status === 'SUPPLIER_RESPONSE_RECEIVED') {
    await supabaseAdmin
      .from('quotations')
      .update({ 
        status: 'SUPPLIER_SPEC_ISSUE', 
        supplier_spec_confirmed: false,
        next_action: '⚠️ URGENT: Supplier spec conflict — contact customer with alternatives'
      })
      .eq('id', id);
    
    sendSpecIssueAdmin(quotation, description).catch(console.error);
  }

  return NextResponse.json({ success: true });
}
