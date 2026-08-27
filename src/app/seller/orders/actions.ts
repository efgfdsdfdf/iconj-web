"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

export async function updateSellerOrderStatus(orderId: string, status: string) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, 
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  await supabaseAdmin
    .from("seller_orders")
    .update({ status })
    .eq("id", orderId);

  // If the status is SHIPPED or DELIVERED, we can also add a timeline event to the parent order
  const { data: subOrder } = await supabaseAdmin
    .from("seller_orders")
    .select("parent_order_id, sellers(businesses(business_name))")
    .eq("id", orderId)
    .single();

  if (subOrder) {
    const sellerName = (subOrder.sellers as any)?.businesses?.business_name || "A seller";
    let eventType = "NOTE_ADDED";
    
    if (status === "SHIPPED") eventType = "SHIPPED";
    if (status === "DELIVERED") eventType = "DELIVERED";

    await supabaseAdmin.from('order_events').insert({
      order_id: subOrder.parent_order_id,
      event_type: eventType,
      description: `${sellerName} marked their part of the order as ${status}.`
    });

    // Check if ALL sub-orders are delivered, if so, mark parent order as DELIVERED
    const { data: siblingOrders } = await supabaseAdmin
      .from("seller_orders")
      .select("status")
      .eq("parent_order_id", subOrder.parent_order_id);
      
    if (siblingOrders) {
      const allDelivered = siblingOrders.every(so => so.status === "DELIVERED");
      if (allDelivered) {
        await supabaseAdmin.from("orders").update({ order_status: "DELIVERED" }).eq("id", subOrder.parent_order_id);
      }
    }
    // Notify customer by email when order is SHIPPED or DELIVERED
    if ((status === "SHIPPED" || status === "DELIVERED") && subOrder.parent_order_id) {
      try {
        const { sendStatusNotification } = await import("@/lib/order-emails");
        await sendStatusNotification(subOrder.parent_order_id, status);
      } catch (e) {
        console.error("Failed to send order status email:", e);
      }
    }
  }

  revalidatePath("/seller/orders");
  revalidatePath(`/admin/orders/${subOrder?.parent_order_id}`);
}
