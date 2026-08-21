"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

export async function updateOrderTracking(formData: FormData) {
  const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  const orderId = formData.get("orderId") as string;
  const status = formData.get("status") as string;
  const carrier = formData.get("carrier") as string;
  const trackingNumber = formData.get("tracking_number") as string;

  if (!orderId) return { error: "Order ID missing" };

  const { error } = await supabaseAdmin.from("orders").update({
    order_status: status,
    shipping_carrier: carrier || null,
    tracking_number: trackingNumber || null
  }).eq("id", orderId);

  if (error) return { error: error.message };

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath(`/track`);
  return { success: true };
}
