"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

export async function importTrackingData(updates: { id: string, tracking: string, carrier: string }[]) {
  const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  try {
    let successCount = 0;
    
    // Process updates sequentially
    for (const update of updates) {
      // The update.id is the first part of the UUID (e.g. 8AC7B112). 
      // We use ilike to find the matching full UUID in the database.
      
      const { data: matchedOrders } = await supabaseAdmin
        .from("orders")
        .select("id")
        .ilike("id", `${update.id}%`);

      if (matchedOrders && matchedOrders.length > 0) {
        const orderId = matchedOrders[0].id;
        
        const { error } = await supabaseAdmin.from("orders").update({
          tracking_number: update.tracking,
          shipping_carrier: update.carrier,
          order_status: "shipped"
        }).eq("id", orderId);
        
        if (!error) {
          successCount++;
        }
      }
    }
    
    revalidatePath("/admin/supplier");
    revalidatePath("/admin/orders");
    
    return { success: true, count: successCount };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
