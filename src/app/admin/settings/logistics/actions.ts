"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function getForwarders() {
  const { data, error } = await supabaseAdmin.from("freight_forwarders").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

export async function upsertForwarder(formData: any) {
  const { id, ...data } = formData;
  
  if (data.is_active) {
    // If setting this to active, set all others to inactive first
    await supabaseAdmin.from("freight_forwarders").update({ is_active: false }).neq("id", "00000000-0000-0000-0000-000000000000");
  }

  const payload = {
    ...data,
    updated_at: new Date().toISOString()
  };

  let result;
  if (id) {
    result = await supabaseAdmin.from("freight_forwarders").update(payload).eq("id", id);
  } else {
    result = await supabaseAdmin.from("freight_forwarders").insert([payload]);
  }

  if (result.error) return { success: false, error: result.error.message };
  
  revalidatePath("/admin/settings/logistics");
  return { success: true };
}

export async function deleteForwarder(id: string) {
  const { error } = await supabaseAdmin.from("freight_forwarders").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/settings/logistics");
  return { success: true };
}
