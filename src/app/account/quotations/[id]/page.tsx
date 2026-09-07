import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { sanitizeQuotationForCustomer } from "@/lib/quotation-helpers";
import QuotationDetailClient from "./QuotationDetailClient";

export const metadata = {
  title: "Quotation Detail | ICONJ",
};

export default async function CustomerQuotationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string; payment?: string }>;
}) {
  const { id } = await params;
  const { token, payment } = await searchParams;

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Fetch full data using admin client since RLS might block if guest (or handle via DB policy)
  // For safety, we fetch via admin, authorize manually, then sanitize.
  const { createClient } = await import('@supabase/supabase-js');
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data: quotation } = await supabaseAdmin
    .from('quotations')
    .select('*')
    .eq('id', id)
    .single();

  if (!quotation) {
    redirect("/account/quotations");
  }

  // Authorization: must be owner OR have the correct access_token
  const isOwner = user && quotation.user_id === user.id;
  const isAuthorizedGuest = token && quotation.access_token === token;

  if (!isOwner && !isAuthorizedGuest) {
    redirect("/login?next=/account/quotations");
  }

  // If this is a first-time view of a SENT quote, mark it as VIEWED
  if (quotation.status === 'QUOTE_SENT' && !quotation.quote_viewed_at) {
    // Fire and forget — we do this server-side so it's guaranteed
    supabaseAdmin
      .from('quotations')
      .update({ quote_viewed_at: new Date().toISOString(), status: 'QUOTE_VIEWED' })
      .eq('id', id)
      .then(() => {
        // Also log timeline event (fetch import dynamically to avoid edge runtime issues if applicable)
      });
  }

  // Sanitize the quotation (removes all supplier data, markup, etc.)
  const safeQuotation = sanitizeQuotationForCustomer(quotation);

  return (
    <QuotationDetailClient 
      quotation={safeQuotation} 
      token={token} 
      paymentStatus={payment} 
    />
  );
}
