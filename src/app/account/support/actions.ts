"use server";

import { createClient } from "@/lib/supabase/server";
import { sendAdminNotification } from "@/lib/email";
import { revalidatePath } from "next/cache";

export async function sendSupportMessage(message: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("support_messages")
    .insert([{
      user_id: user.id,
      message,
      is_from_admin: false
    }]);

  if (error) {
    console.error("Chat error:", error);
    return { error: "Failed to send message. Note: support_messages table must be created." };
  }

  // Check if this is their first message to send an automated response
  const { count } = await supabase
    .from("support_messages")
    .select("*", { count: 'exact', head: true })
    .eq("user_id", user.id);
    
  if (count === 1) {
    const supabaseAdmin = require("@supabase/supabase-js").createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    await supabaseAdmin.from("support_messages").insert([{
      user_id: user.id,
      message: "Hi there! 👋 Thank you for reaching out to ICONJ Support. We have received your message. One of our agents will be with you shortly. If this is urgent, please leave your phone number.",
      is_from_admin: true
    }]);
  }

  const name = user.user_metadata?.full_name || user.email;

  // Send an email to the admin
  const htmlContent = `
    <h2>New Support Message</h2>
    <p><strong>From:</strong> ${name} (${user.email})</p>
    <p><strong>Message:</strong></p>
    <blockquote style="border-left: 4px solid #ccc; padding-left: 10px; margin-left: 0;">${message}</blockquote>
    <br/>
    <p><a href="https://iconj-web-rust.vercel.app/admin/support">Reply in Admin Dashboard</a></p>
  `;
  await sendAdminNotification(`💬 New Message from ${name}`, htmlContent).catch(console.error);

  revalidatePath("/account/support");
  return { success: true };
}
