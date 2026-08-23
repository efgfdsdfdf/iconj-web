"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/admin";
import { sendEmailTo } from "@/lib/email";

export async function sendOrderToSupplier(orderId: string, overrideEmail?: string) {
  const adminId = await requireAdmin();

  const supabaseAdmin = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { get() { return undefined; } } }
  );

  // 1. Fetch order & items & supplier
  const { data: order } = await supabaseAdmin.from("orders").select("*, supplier:suppliers(email)").eq("id", orderId).single();
  const { data: items } = await supabaseAdmin.from("order_items").select("*, product:products(name, sku, supplier_sku, variants)").eq("order_id", orderId);
  
  if (order?.supplier_sent) {
    throw new Error("Order has already been sent to supplier.");
  }

  // 2. Generate and Send Email
  const supplierEmail = overrideEmail || order.supplier?.email;
  if (supplierEmail) {
    const address = order.delivery_address || {};
    const shortId = `ICONJ-ORD-${order.id.split("-")[0].toUpperCase()}`;
    const supplierName = order.supplier?.name || "Supplier";
    
    let body = `ICONJ ORDER: ${shortId}\n\n`;
    
    (items || []).forEach((item: any, index: number) => {
      const config = item.configuration_details || {};
      const storeSku = config.store_sku || item.product?.sku || "N/A";
      const supplierSku = config.supplier_sku || item.product?.supplier_sku || "N/A";
      const productName = config.product_name || item.product?.name || "Unknown Product";
      const variant = config.variant_string || "Standard";
      const supplierUrl = config.supplier_product_url || item.product?.variants?.supplier_product_url || "N/A";

      body += `PRODUCT ID: ${storeSku}\n`;
      body += `PRODUCT: ${productName}\n`;
      body += `VARIANT: ${variant}\n`;
      body += `QUANTITY: ${item.quantity}\n\n`;
      
      body += `SUPPLIER: ${supplierName}\n`;
      body += `SUPPLIER SKU: ${supplierSku}\n`;
      body += `SUPPLIER PRODUCT URL: ${supplierUrl}\n\n`;
    });
    
    body += `CUSTOMER SHIPPING:\n`;
    body += `Name: ${address.name || "N/A"}\n`;
    body += `Phone: ${address.phone || "N/A"}\n`;
    body += `Address: ${address.street || "N/A"}\n`;
    body += `City: ${address.city || "N/A"}\n`;
    body += `State: ${address.state || "N/A"}\n`;
    body += `Country: ${address.country || "Nigeria"}\n\n`;
    
    await sendEmailTo(supplierEmail, `New Order Request - ${shortId}`, body);
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
