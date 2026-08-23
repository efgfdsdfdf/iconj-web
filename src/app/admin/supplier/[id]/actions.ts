"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/admin";

export async function addSupplierFunds(supplierId: string, amount: number, reference: string, description: string) {
  const adminId = await requireAdmin();
  if (amount <= 0) throw new Error("Amount must be greater than 0");

  const supabaseAdmin = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { get() { return undefined; } } }
  );

  const { error } = await supabaseAdmin.from("supplier_transactions").insert({
    supplier_id: supplierId,
    transaction_type: "FUNDS_ADDED",
    credit_debit: "CREDIT",
    amount: amount,
    reference,
    description: description || "Funds added to supplier balance",
    admin_id: adminId
  });

  if (error) throw new Error(error.message);
  // revalidatePath(`/admin/supplier/${supplierId}`);
  // revalidatePath("/admin/supplier");
}

export async function recordSupplierPayment(supplierId: string, orderId: string, amount: number, reference: string) {
  const adminId = await requireAdmin();
  if (amount <= 0) throw new Error("Amount must be greater than 0");

  const supabaseAdmin = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { get() { return undefined; } } }
  );

  // Note: the Postgres trigger will reject this if balance < amount.
  const { error } = await supabaseAdmin.from("supplier_transactions").insert({
    supplier_id: supplierId,
    order_id: orderId,
    transaction_type: "SUPPLIER_PAYMENT",
    credit_debit: "DEBIT",
    amount: amount,
    reference,
    description: `Payment for order #${orderId.split("-")[0].toUpperCase()}`,
    admin_id: adminId
  });

  if (error) {
    if (error.message.includes("Insufficient supplier balance")) {
      throw new Error("Insufficient supplier balance. Add funds first.");
    }
    if (error.message.includes("idx_unique_supplier_payment")) {
      throw new Error("A payment for this order has already been recorded.");
    }
    throw new Error(error.message);
  }

  // Update order status if payment succeeds
  await supabaseAdmin.from("orders").update({
    supplier_order_status: "PAID"
  }).eq("id", orderId);

  // Record order event
  await supabaseAdmin.from("order_events").insert({
    order_id: orderId,
    event_type: "SUPPLIER_PAYMENT_RECORDED",
    description: "Supplier payment recorded in ledger.",
    admin_id: adminId
  });

  // revalidatePath(`/admin/supplier/${supplierId}`);
  // revalidatePath(`/admin/orders/${orderId}`);
  // revalidatePath("/admin/supplier");
}

export async function deleteSupplier(supplierId: string) {
  await requireAdmin();
  const supabaseAdmin = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { cookies: { get() { return undefined; } } });
  const { error } = await supabaseAdmin.from('suppliers').delete().eq('id', supplierId);
  if (error) return { success: false, error: error.message };
  // revalidatePath('/admin/supplier');
  return { success: true };
}

export async function recordAdjustment(supplierId: string, amount: number, creditDebit: "CREDIT" | "DEBIT", description: string) {
  const adminId = await requireAdmin();
  const supabaseAdmin = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { cookies: { get() { return undefined; } } });

  const { error } = await supabaseAdmin.from("supplier_transactions").insert({
    supplier_id: supplierId,
    transaction_type: "ADJUSTMENT",
    credit_debit: creditDebit,
    amount: amount,
    reference: "ADJ-" + Math.random().toString(36).substring(2, 8).toUpperCase(),
    description: description,
    admin_id: adminId
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}
