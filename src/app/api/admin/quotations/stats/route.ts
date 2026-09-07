import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdmin } from '@/lib/auth/admin';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// GET /api/admin/quotations/stats
export async function GET() {
  const adminAuth = await verifyAdmin();
  if (!adminAuth.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Simple stats for the dashboard header
  const { data, error } = await supabaseAdmin
    .from('quotations')
    .select('status, customer_total, is_exception');

  if (error) return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });

  let totalActive = 0;
  let pipelineValue = 0;
  let conversionCount = 0;
  let exceptionCount = 0;

  (data || []).forEach(q => {
    if (!['QUOTE_DECLINED', 'QUOTE_EXPIRED'].includes(q.status)) {
      totalActive++;
    }
    
    if (['QUOTE_SENT', 'QUOTE_VIEWED', 'QUOTE_ACCEPTED'].includes(q.status) && q.customer_total) {
      pipelineValue += Number(q.customer_total);
    }

    if (['PAID', 'CONVERTED_TO_ORDER'].includes(q.status)) {
      conversionCount++;
    }

    if (q.is_exception) {
      exceptionCount++;
    }
  });

  return NextResponse.json({
    totalActive,
    pipelineValue,
    conversionCount,
    exceptionCount
  });
}
