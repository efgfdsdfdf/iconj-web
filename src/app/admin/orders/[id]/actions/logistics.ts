"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function updateLogisticsStatus(orderId: string, status: string, trackingNumber?: string, source: string = "Admin") {
  const payload: any = { logistics_status: status };
  
  if (trackingNumber) {
    if (status === "SUPPLIER_SHIPPED") payload.supplier_tracking_number = trackingNumber;
    else if (status === "SHIPPED_TO_NIGERIA") payload.forwarder_tracking_number = trackingNumber;
    else if (status === "OUT_FOR_DELIVERY") payload.china_warehouse_tracking = trackingNumber; // reuse field for local if needed
  }

  const { error } = await supabaseAdmin.from("orders").update(payload).eq("id", orderId);
  if (error) return { success: false, error: error.message };

  await supabaseAdmin.from("order_events").insert({
    order_id: orderId,
    event_type: status,
    description: `Order logistics updated to ${status}.${trackingNumber ? ` Tracking: ${trackingNumber}` : ""}`,
  });

  revalidatePath(`/admin/orders/${orderId}`);
  return { success: true };
}

export async function recordForwarderReceipt(orderId: string, expectedQty: number, receivedQty: number, weight: number) {
  const { error } = await supabaseAdmin.from("orders").update({
    expected_quantity: expectedQty,
    received_quantity: receivedQty,
    forwarder_chargeable_weight: weight,
    logistics_status: "FORWARDER_RECEIVED"
  }).eq("id", orderId);

  if (error) return { success: false, error: error.message };

  await supabaseAdmin.from("order_events").insert({
    order_id: orderId,
    event_type: "FORWARDER_RECEIVED",
    description: `Forwarder received ${receivedQty} units (Expected: ${expectedQty}). Weight: ${weight}kg.`
  });

  if (expectedQty !== receivedQty) {
    await supabaseAdmin.from("logistics_issues").insert({
      order_id: orderId,
      issue_type: "QUANTITY_MISMATCH",
      description: `Forwarder received ${receivedQty} units, but ${expectedQty} were ordered.`,
      expected_data: { quantity: expectedQty },
      received_data: { quantity: receivedQty },
      status: "OPEN"
    });
  }

  revalidatePath(`/admin/orders/${orderId}`);
  return { success: true };
}

export async function resolveLogisticsIssue(issueId: string) {
  const { error } = await supabaseAdmin.from("logistics_issues").update({
    status: "RESOLVED",
    resolved_at: new Date().toISOString()
  }).eq("id", issueId);

  if (error) return { success: false, error: error.message };
  
  revalidatePath(`/admin/orders`);
  return { success: true };
}
