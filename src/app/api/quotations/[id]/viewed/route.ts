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

// POST /api/quotations/[id]/viewed — Mark quote as viewed (idempotent)
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: quotation } = await supabaseAdmin
    .from('quotations')
    .select('id, user_id, access_token, status, quote_viewed_at')
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

  // Idempotent — only set if null and status is QUOTE_SENT
  if (!quotation.quote_viewed_at && quotation.status === 'QUOTE_SENT') {
    await supabaseAdmin
      .from('quotations')
      .update({ quote_viewed_at: new Date().toISOString(), status: 'QUOTE_VIEWED' })
      .eq('id', id);
    await logQuotationEvent(id, 'QUOTE_VIEWED', 'Customer viewed the quotation', 'customer');
  }

  return NextResponse.json({ success: true });
}
