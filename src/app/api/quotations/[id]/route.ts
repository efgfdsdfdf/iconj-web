import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { sanitizeQuotationForCustomer, ADMIN_ONLY_FIELDS } from '@/lib/quotation-helpers';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

/** Verify the requesting user is authorised to view this quotation.
 *  Authenticated users must own it (user_id match).
 *  Guests can access via the secure access_token query param.
 */
async function authorizeAccess(quotation: any, request: Request): Promise<boolean> {
  const url = new URL(request.url);
  const tokenParam = url.searchParams.get('token');

  // Guest access via secure random token
  if (tokenParam && quotation.access_token === tokenParam) return true;

  // Authenticated user must own the quotation
  try {
    const cookieStore = await cookies();
    const supabaseClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (user && quotation.user_id === user.id) return true;
  } catch { /* not authenticated */ }

  return false;
}

// ─── GET /api/quotations/[id] ────────────────────────────────────────────────
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data: quotation, error } = await supabaseAdmin
    .from('quotations')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !quotation) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const authorized = await authorizeAccess(quotation, request);
  if (!authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  // Strip all admin-only fields before returning to customer
  return NextResponse.json({ quotation: sanitizeQuotationForCustomer(quotation) });
}
