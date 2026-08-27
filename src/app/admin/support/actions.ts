"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

export async function replyToUser(userId: string, message: string) {
  const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  const { error } = await supabaseAdmin
    .from("support_messages")
    .insert([{
      user_id: userId,
      message,
      is_from_admin: true
    }]);

  if (error) return { error: error.message };

  // Fetch the customer's email
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("email, full_name")
    .eq("id", userId)
    .single();

  if (profile?.email) {
    const customerName = profile.full_name || "Customer";
    const htmlContent = `
      <h2>New reply from ICONJ Support</h2>
      <p>Hi ${customerName},</p>
      <p>An admin has replied to your support message:</p>
      <blockquote style="border-left: 4px solid #ccc; padding-left: 10px; margin-left: 0;">${message}</blockquote>
      <br/>
      <p><a href="https://iconj-web-rust.vercel.app/account/support">Click here to reply</a></p>
    `;
    
    // Send email via Resend API
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({
          from: "ICONJ Support <noreply@iconj.com.ng>",
          to: [profile.email],
          subject: "New reply from ICONJ Support",
          html: htmlContent
        })
      });
    } catch (e) {
      console.error("Failed to send customer notification email:", e);
    }
  }

  revalidatePath("/admin/support");
  return { success: true };
}
