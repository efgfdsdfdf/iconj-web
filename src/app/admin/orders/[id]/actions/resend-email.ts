"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { requireAdmin } from "@/lib/auth/admin";
import { sendPaymentReceipt, sendStatusNotification } from "@/lib/order-emails";

export async function resendOrderEmail(orderId: string, emailType: string) {
  await requireAdmin();

  const supabaseAdmin = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { get() { return undefined; } } }
  );

  // 1. Delete the existing record
  const { error: deleteError } = await supabaseAdmin
    .from("order_emails")
    .delete()
    .eq("order_id", orderId)
    .eq("email_type", emailType);

  if (deleteError) {
    console.error("Failed to delete order_email record:", deleteError);
    return { success: false, error: deleteError.message };
  }

  // 2. Resend based on type
  try {
    if (emailType === "PAYMENT_RECEIPT") {
      const result = await sendPaymentReceipt(orderId);
      return result;
    } else {
      // It's a status notification
      // (For SHIPPED, we might miss tracking details here unless we re-fetch them from the order,
      // but sendStatusNotification already refetches order and we could theoretically pass tracking info.
      // Currently sendStatusNotification accepts extraData, but since we don't have it easily available,
      // the base status email will be sent).
      const { data: order } = await supabaseAdmin
        .from("orders")
        .select("tracking_number, shipping_carrier")
        .eq("id", orderId)
        .single();
      
      let extraData = undefined;
      if (emailType === "SHIPPED" && order) {
        extraData = {
          tracking_number: order.tracking_number,
          shipping_carrier: order.shipping_carrier
        };
      }

      const result = await sendStatusNotification(orderId, emailType, extraData);
      return result;
    }
  } catch (err: any) {
    console.error("Error resending email:", err);
    return { success: false, error: err.message };
  }
}
