import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdmin } from '@/lib/auth/admin';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ─── GET /api/admin/quotations — List with filters ───────────────────────────
export async function GET(request: Request) {
  const adminAuth = await verifyAdmin();
  if (!adminAuth.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const filter = url.searchParams.get('filter');
  const search = url.searchParams.get('search');
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('quotations')
    .select('id, reference, customer_name, customer_email, product_name, quantity, status, priority, next_action, customer_total, payment_status, is_exception, fulfillment_blocked, supplier_fulfillment_status, created_at, quote_sent_at, quote_accepted_at, payment_date, converted_order_id', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // Status filter
  if (status) {
    if (status === 'QUOTE_AWAITING') {
      query = query.in('status', ['QUOTE_SENT', 'QUOTE_VIEWED']);
    } else {
      query = query.eq('status', status);
    }
  }

  // Exceptions-only filter (SAFEGUARD 6)
  if (filter === 'exceptions') {
    query = query.eq('is_exception', true);
  }

  // Search
  if (search) {
    query = query.or(`customer_name.ilike.%${search}%,reference.ilike.%${search}%,product_name.ilike.%${search}%,customer_email.ilike.%${search}%`);
  }

  const { data: quotations, count, error } = await query;

  if (error) return NextResponse.json({ error: 'Failed to fetch quotations' }, { status: 500 });

  // Get dashboard counts for all statuses
  const { data: countData } = await supabaseAdmin
    .from('quotations')
    .select('status, is_exception, priority')
    .not('status', 'in', '("QUOTE_DECLINED","CONVERTED_TO_ORDER")');

  const counts: Record<string, number> = {};
  let urgentCount = 0;
  let exceptionCount = 0;

  (countData || []).forEach((q: any) => {
    counts[q.status] = (counts[q.status] || 0) + 1;
    if (q.priority === 'URGENT') urgentCount++;
    if (q.is_exception) exceptionCount++;
  });

  // Awaiting customer = QUOTE_SENT + QUOTE_VIEWED combined
  counts['QUOTE_AWAITING'] = (counts['QUOTE_SENT'] || 0) + (counts['QUOTE_VIEWED'] || 0);

  return NextResponse.json({
    quotations: quotations || [],
    total: count || 0,
    page,
    limit,
    counts,
    urgentCount,
    exceptionCount,
  });
}
