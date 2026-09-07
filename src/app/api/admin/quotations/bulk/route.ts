import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdmin } from '@/lib/auth/admin';
import { sendQuoteReminder1 } from '@/lib/quotation-emails';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// POST /api/admin/quotations/bulk
export async function POST(request: Request) {
  const adminError = await verifyAdmin();
  if (adminError) return adminError;

  const { action, ids } = await request.json();

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'No IDs provided' }, { status: 400 });
  }

  // Fetch target quotations
  const { data: quotations } = await supabaseAdmin
    .from('quotations')
    .select('*')
    .in('id', ids);

  if (!quotations || quotations.length === 0) {
    return NextResponse.json({ error: 'Quotations not found' }, { status: 404 });
  }

  const results = {
    successCount: 0,
    failedCount: 0,
    errors: [] as string[],
    data: null as any
  };

  switch (action) {
    case 'export':
      // Safe bulk export (never exports supplier costs or admin notes)
      const exportData = quotations.map(q => ({
        Reference: q.reference,
        Customer: q.customer_name,
        Email: q.customer_email,
        Phone: q.customer_phone,
        Product: q.product_name,
        Status: q.status,
        CustomerTotal: q.customer_total,
        Priority: q.priority,
        CreatedAt: q.created_at,
        PaymentStatus: q.payment_status,
        HasException: q.is_exception ? 'Yes' : 'No'
      }));
      results.successCount = exportData.length;
      results.data = exportData;
      break;

    case 'remind':
      // Bulk send reminders (individually processed to avoid cross-contamination)
      const now = new Date().toISOString();
      const twelveHoursAgo = Date.now() - (12 * 60 * 60 * 1000);

      for (const q of quotations) {
        if (!['QUOTE_SENT', 'QUOTE_VIEWED'].includes(q.status)) {
          results.failedCount++;
          results.errors.push(`${q.reference}: Cannot remind in status ${q.status}`);
          continue;
        }

        if (q.reminder_1_sent_at && new Date(q.reminder_1_sent_at).getTime() > twelveHoursAgo) {
          results.failedCount++;
          results.errors.push(`${q.reference}: Reminder sent recently`);
          continue;
        }

        try {
          const emailResult = await sendQuoteReminder1(q);
          if (emailResult.success) {
            await supabaseAdmin.from('quotations').update({ reminder_1_sent_at: now }).eq('id', q.id);
            results.successCount++;
          } else {
            results.failedCount++;
            results.errors.push(`${q.reference}: Email send failed`);
          }
        } catch (e: any) {
          results.failedCount++;
          results.errors.push(`${q.reference}: ${e.message}`);
        }
      }
      break;

    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  return NextResponse.json(results);
}
