"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function updateOrderTracking(formData: FormData) {
  const supabaseAdmin = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { get() { return undefined; } } }
  );
  
  const orderId = formData.get("orderId") as string;
  const status = formData.get("status") as string;
  const carrier = formData.get("carrier") as string;
  const trackingNumber = formData.get("tracking_number") as string;
  const paymentStatus = formData.get("payment_status") as string;

  if (!orderId) return { error: "Order ID missing" };

  const { error } = await supabaseAdmin.from("orders").update({
    order_status: status,
    shipping_carrier: carrier || null,
    tracking_number: trackingNumber || null,
    payment_status: paymentStatus || undefined
  }).eq("id", orderId);

  if (error) return { error: error.message };

  const emailStatuses = ['PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
  if (emailStatuses.includes(status)) {
    try {
      const { sendStatusNotification } = await import("@/lib/order-emails");
      await sendStatusNotification(orderId, status, {
        tracking_number: trackingNumber,
        shipping_carrier: carrier
      });
    } catch (e) {
      console.error('Failed to send status email:', e);
    }
  }

  // Also add an order_event for status changes
  await supabaseAdmin.from('order_events').insert({
    order_id: orderId,
    event_type: status,
    description: `Order status updated to ${status}.`
  });

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath(`/track`);
  return { success: true };
}

export async function markOrderAsViewed(orderId: string) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: { get(name) { return cookieStore.get(name)?.value; } }
    }
  );
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== "ezeilodavid292@gmail.com") return;

  const supabaseAdmin = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { get() { return undefined; } } }
  );

  await supabaseAdmin.from("orders").update({
    admin_viewed: true,
    admin_viewed_at: new Date().toISOString(),
    admin_viewed_by: user.id
  }).eq("id", orderId);

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin");
}
