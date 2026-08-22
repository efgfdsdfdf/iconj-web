"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/admin";

export async function sendOrderToSupplier(orderId: string) {
  const adminId = await requireAdmin();

  const supabaseAdmin = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { get() { return undefined; } } }
  );

  // 1. Verify it hasn't been sent already
  const { data: order } = await supabaseAdmin.from("orders").select("supplier_sent").eq("id", orderId).single();
  
  if (order?.supplier_sent) {
    throw new Error("Order has already been sent to supplier.");
  }

  // 2. Mark as sent
  const { error } = await supabaseAdmin.from("orders").update({
    supplier_sent: true,
    supplier_sent_at: new Date().toISOString(),
    supplier_order_status: 'SENT'
  }).eq("id", orderId);

  if (error) throw error;

  // 3. Add Timeline Event
  await supabaseAdmin.from("order_events").insert({
    order_id: orderId,
    event_type: "SENT_TO_SUPPLIER",
    description: "Order details sent to supplier for fulfillment.",
    admin_id: adminId
  });

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath(`/admin/orders`);
}
