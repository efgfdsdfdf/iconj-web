"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/admin";
import { sendEmailTo } from "@/lib/email";

export async function sendOrderToSupplier(orderId: string) {
  const adminId = await requireAdmin();

  const supabaseAdmin = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { get() { return undefined; } } }
  );

  // 1. Fetch order & items & supplier
  const { data: order } = await supabaseAdmin.from("orders").select("*, supplier:suppliers(email)").eq("id", orderId).single();
  const { data: items } = await supabaseAdmin.from("order_items").select("*, product:products(name, sku)").eq("order_id", orderId);
  
  if (order?.supplier_sent) {
    throw new Error("Order has already been sent to supplier.");
  }

  // 2. Generate and Send Email
  const supplierEmail = order.supplier?.email;
  if (supplierEmail) {
    const address = order.delivery_address || {};
    const shortId = order.id.split("-")[0].toUpperCase();
    
    let body = `Hello Supplier Team,\n\n`;
    body += `Please process the following new order (ID: #${shortId}).\n\n`;
    
    body += `--- ORDER ITEMS ---\n`;
    (items || []).forEach((item: any, index: number) => {
      body += `${index + 1}. ${item.product?.name || "Unknown Product"} (SKU: ${item.product?.sku || "N/A"})\n`;
      body += `   Quantity: ${item.quantity}\n\n`;
    });
    
    body += `--- SHIPPING ADDRESS ---\n`;
    body += `${address.name || "N/A"}\n`;
    body += `${address.street || "N/A"}\n`;
    body += `${address.city || "N/A"}\n`;
    body += `${address.state || "N/A"}\n`;
    body += `${address.phone || "N/A"}\n\n`;
    
    body += `Please confirm receipt of this order and provide tracking information when dispatched.\n\n`;
    body += `Thank you,\nICONJ Team`;
    
    await sendEmailTo(supplierEmail, `New Order Request - ICONJ #${shortId}`, body);
  }

  // 3. Mark as sent
  const { error } = await supabaseAdmin.from("orders").update({
    supplier_sent: true,
    supplier_sent_at: new Date().toISOString(),
    supplier_order_status: 'SENT'
  }).eq("id", orderId);

  if (error) throw error;

  // 4. Add Timeline Event
  await supabaseAdmin.from("order_events").insert({
    order_id: orderId,
    event_type: "SENT_TO_SUPPLIER",
    description: "Order details sent to supplier for fulfillment.",
    admin_id: adminId
  });

  try {
    const { sendStatusNotification } = await import("@/lib/order-emails");
    await sendStatusNotification(orderId, 'SENT_TO_SUPPLIER');
  } catch (e) {
    console.error('Failed to send supplier notification email:', e);
  }

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath(`/admin/orders`);
}
