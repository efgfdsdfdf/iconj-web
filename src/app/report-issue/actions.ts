"use server";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function getUserOrdersForIssues() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not logged in" };
  }

  // Use admin client to bypass RLS since users need to see their own orders
  const supabaseAdmin = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("id, created_at, order_status")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching orders:", error);
    return { error: "Failed to fetch orders" };
  }

  return { orders: data, userId: user.id };
}

export async function submitOrderIssue(formData: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not logged in" };
  }

  const supabaseAdmin = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const { data, error } = await supabaseAdmin
    .from("order_issues")
    .insert({
      ...formData,
      customer_id: user.id,
      status: "Submitted"
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error inserting issue:", error);
    return { error: error.message };
  }

  return { success: true, id: data.id };
}
