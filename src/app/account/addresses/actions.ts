"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addAddress(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const label = formData.get("label") as string;
  const street = formData.get("street") as string;
  const city = formData.get("city") as string;
  const state = formData.get("state") as string;
  const phone = formData.get("phone") as string;
  const setAsDefault = formData.get("is_default") === "on";

  if (setAsDefault) {
    // Reset other defaults
    await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id);
  }

  // Check if they have any addresses at all; if not, force default
  const { count } = await supabase.from("addresses").select("*", { count: "exact", head: true }).eq("user_id", user.id);
  const isFirst = count === 0;

  const { error } = await supabase.from("addresses").insert([{
    user_id: user.id,
    label,
    street,
    city,
    state,
    phone,
    is_default: setAsDefault || isFirst
  }]);

  if (error) return { error: error.message };

  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
  return { success: true };
}

export async function deleteAddress(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  await supabase.from("addresses").delete().eq("id", id).eq("user_id", user.id);
  
  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
  return { success: true };
}

export async function setDefaultAddress(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  // First, set all to false
  await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id);
  // Set the selected to true
  await supabase.from("addresses").update({ is_default: true }).eq("id", id).eq("user_id", user.id);
  
  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
  return { success: true };
}
