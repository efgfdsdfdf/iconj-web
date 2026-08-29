"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateStoreSettings(sellerId: string, storeId: string | undefined, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const storeName = formData.get("store_name") as string;
  const description = formData.get("description") as string;
  const returnPolicy = formData.get("return_policy") as string;

  if (!storeName) throw new Error("Store name is required");

  // Generate slug from store name if creating new
  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 6);
  };

  const payload = {
    seller_id: sellerId,
    store_name: storeName,
    description: description || null,
    return_policy: returnPolicy || null,
  };

  if (storeId) {
    const { error } = await supabase
      .from("stores")
      .update(payload)
      .eq("id", storeId);
    
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("stores")
      .insert({ ...payload, slug: generateSlug(storeName), is_active: true });
    
    if (error) throw new Error(error.message);
  }

  revalidatePath("/seller/store");
  revalidatePath("/seller");
  return { success: true };
}
