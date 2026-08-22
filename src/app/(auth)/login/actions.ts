"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const redirectUrl = (formData.get("redirectUrl") as string) || "/account";

  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: error.message };
    }

    return { success: true, redirectUrl };
  } catch (err: any) {
    console.error("Login Error:", err);
    return { error: err.message || "An unexpected error occurred during login on the server." };
  }
}
