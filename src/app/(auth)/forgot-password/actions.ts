"use server";

import { createClient as createAdminClient } from "@supabase/supabase-js";
import { sendEmailTo } from "@/lib/email";

export async function resetPassword(formData: FormData) {
  const email = formData.get("email") as string;
  if (!email) {
    return { error: "Email is required" };
  }

  // Use Admin Client to generate recovery link directly (bypasses Supabase email limits)
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  const origin = process.env.NEXT_PUBLIC_SITE_URL || "https://iconj.com.ng";

  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: "recovery",
    email: email,
    options: {
      redirectTo: `${origin}/api/auth/callback?next=/update-password`,
    }
  });

  if (error) {
    console.error("Password reset link generation error:", error);
    return { success: true }; // Hide error from client
  }

  // Send the generated link via our own Resend integration
  if (data?.properties?.action_link) {
    const resetUrl = data.properties.action_link;
    
    const htmlEmail = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 24px; border-radius: 12px;">
        <div style="background: #1e3a5f; padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 22px;">Password Reset Request</h1>
        </div>
        <div style="background: white; padding: 28px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0; border-top: none;">
          <p style="color: #475569; margin: 0 0 16px; font-size: 16px;">Hello,</p>
          <p style="color: #475569; margin: 0 0 24px; line-height: 1.6;">We received a request to reset your password for your ICONJ account. If you didn't make this request, you can safely ignore this email.</p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" style="display: inline-block; background: #0f172a; color: white; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px;">Reset Password</a>
          </div>

          

          <p style="color: #94a3b8; font-size: 12px; margin: 24px 0 0; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 24px;">ICONJ — Premium Window Coverings</p>
        </div>
      </div>
    `;

    await sendEmailTo(email, "Reset your ICONJ Password", htmlEmail);
  }

  // Always return success so malicious actors can't guess valid emails
  return { success: true };
}