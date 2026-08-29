"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updatePassword(formData: FormData) {
  const password = formData.get("password") as string;
  
  if (!password || password.length < 6) {
    return { error: "Password must be at least 6 characters long." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    console.error("Update password error:", error);
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  return { success: true };
}
