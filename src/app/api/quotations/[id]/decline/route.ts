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

// POST /api/quotations/[id]/decline
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: quotation } = await supabaseAdmin
    .from('quotations')
    .select('*')
    .eq('id', id)
    .single();

  if (!quotation) return NextResponse.json({ error: 'Not found' }, { status: 404 });

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

  if (quotation.quote_declined_at) return NextResponse.json({ success: true, alreadyDeclined: true });

  if (!['QUOTE_SENT', 'QUOTE_VIEWED', 'QUOTE_ACCEPTED'].includes(quotation.status)) {
    return NextResponse.json({ error: 'Cannot decline in current state' }, { status: 400 });
  }

  await supabaseAdmin
    .from('quotations')
    .update({
      status: 'QUOTE_DECLINED',
      quote_declined_at: new Date().toISOString(),
      priority: 'NO_ACTION',
      next_action: 'Quotation declined by customer — no action required',
    })
    .eq('id', id);

  await logQuotationEvent(id, 'QUOTE_DECLINED', 'Customer declined the quotation', 'customer');

  return NextResponse.json({ success: true });
}
