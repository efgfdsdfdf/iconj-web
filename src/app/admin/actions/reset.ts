"use server";

import { createServerClient } from "@supabase/ssr";
import { requireAdmin } from "@/lib/auth/admin";
import { revalidatePath } from "next/cache";

export async function resetStoreData() {
  const adminId = await requireAdmin();
  const supabaseAdmin = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { cookies: { get() { return undefined; } } });

  try {
    // 1. Delete all orders (This cascades to order_items, order_events, order_emails)
    await supabaseAdmin.from("orders").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    // 2. Delete all admin notifications
    await supabaseAdmin.from("admin_notifications").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    // 3. Zero out supplier ledgers using ADJUSTMENT transactions
    const { data: suppliers } = await supabaseAdmin.from("suppliers").select("id");
    if (suppliers) {
      for (const supplier of suppliers) {
        // Get current balance
        const { data: latestTx } = await supabaseAdmin
          .from("supplier_transactions")
          .select("new_balance")
          .eq("supplier_id", supplier.id)
          .order("sequence_num", { ascending: false })
          .limit(1)
          .single();
          
        const balance = latestTx ? Number(latestTx.new_balance) : 0;
        
        if (balance !== 0) {
          const type = balance > 0 ? "DEBIT" : "CREDIT";
          const amount = Math.abs(balance);
          
          await supabaseAdmin.from("supplier_transactions").insert({
            supplier_id: supplier.id,
            transaction_type: "ADJUSTMENT",
            credit_debit: type,
            amount: amount,
            reference: "RESET-" + Date.now(),
            description: "System Reset: Clearing Test Data",
            admin_id: adminId
          });
        }
      }
    }

    revalidatePath("/", "layout");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to reset store data." };
  }
}