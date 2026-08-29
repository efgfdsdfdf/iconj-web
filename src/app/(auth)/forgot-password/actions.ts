"use server";

import { createClient } from "@/lib/supabase/server";

export async function resetPassword(formData: FormData) {
  const email = formData.get("email") as string;
  if (!email) {
    return { error: "Email is required" };
  }

  const supabase = await createClient();
  
  // We determine the origin from the VERCEL_URL if deployed, or fallback to localhost
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 
                 (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/api/auth/callback?next=/update-password`,
  });

  if (error) {
    // Log the error internally but do NOT expose it to the client to prevent email enumeration
    console.error("Password reset error:", error);
  }

  // Always return success so malicious actors can't guess valid emails
  return { success: true };
}
