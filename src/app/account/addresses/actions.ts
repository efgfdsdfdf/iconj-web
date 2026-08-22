"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addAddress(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const id = formData.get("id") as string || crypto.randomUUID();
  const label = formData.get("label") as string;
  const street = formData.get("street") as string;
  const city = formData.get("city") as string;
  const state = formData.get("state") as string;
  const phone = formData.get("phone") as string;
  let setAsDefault = formData.get("is_default") === "on";

  let addresses = user.user_metadata?.addresses || [];
  if (!Array.isArray(addresses)) addresses = [];

  const isFirst = addresses.length === 0;
  if (isFirst) setAsDefault = true;

  if (setAsDefault) {
    addresses = addresses.map((addr: any) => ({ ...addr, is_default: false }));
  }

  const existingIndex = addresses.findIndex((a: any) => a.id === id);
  const newAddress = {
    id,
    label,
    street,
    city,
    state,
    phone,
    is_default: setAsDefault
  };

  if (existingIndex >= 0) {
    addresses[existingIndex] = newAddress;
  } else {
    addresses.push(newAddress);
  }

  const { error } = await supabase.auth.updateUser({
    data: { addresses }
  });

  if (error) return { error: error.message };

  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
  return { success: true };
}

export async function deleteAddress(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  let addresses = user.user_metadata?.addresses || [];
  if (!Array.isArray(addresses)) addresses = [];

  addresses = addresses.filter((a: any) => a.id !== id);

  const { error } = await supabase.auth.updateUser({
    data: { addresses }
  });

  if (error) return { error: error.message };

  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
  return { success: true };
}

export async function setDefaultAddress(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  let addresses = user.user_metadata?.addresses || [];
  if (!Array.isArray(addresses)) addresses = [];

  addresses = addresses.map((addr: any) => ({
    ...addr,
    is_default: addr.id === id
  }));

  const { error } = await supabase.auth.updateUser({
    data: { addresses }
  });

  if (error) return { error: error.message };

  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
  return { success: true };
}
