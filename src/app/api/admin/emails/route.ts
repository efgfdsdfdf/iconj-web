import { verifyAdmin } from "@/lib/auth/admin";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// GET: List all emails for a given order (or all failed emails)
export async function GET(req: NextRequest) {
  const { isAdmin } = await verifyAdmin();
  if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("orderId");
  const statusFilter = searchParams.get("status"); // e.g. "FAILED"

  let query = supabase
    .from("order_emails")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (orderId) query = query.eq("order_id", orderId);
  if (statusFilter) query = query.eq("status", statusFilter);

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ emails: data });
}

// POST: Retry a failed email
export async function POST(req: NextRequest) {
  const { isAdmin } = await verifyAdmin();
  if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const { emailId } = await req.json();

    // Fetch the failed email record
    const { data: emailRecord, error: fetchError } = await supabase
      .from("order_emails")
      .select("*")
      .eq("id", emailId)
      .single();

    if (fetchError || !emailRecord) {
      return NextResponse.json({ error: "Email record not found" }, { status: 404 });
    }

    if (emailRecord.status === "SENT") {
      return NextResponse.json({ error: "Email was already sent successfully" }, { status: 400 });
    }

    // Reset to PENDING so sendOrderEmail can re-process it
    await supabase
      .from("order_emails")
      .update({ status: "PENDING", error_message: null })
      .eq("id", emailId);

    // Re-trigger the email
    const { sendStatusNotification, sendPaymentReceipt } = await import("@/lib/order-emails");

    let result;
    if (emailRecord.email_type === "PAYMENT_RECEIPT") {
      result = await sendPaymentReceipt(emailRecord.order_id);
    } else {
      result = await sendStatusNotification(emailRecord.order_id, emailRecord.email_type);
    }

    return NextResponse.json({ success: result?.success ?? false, result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
