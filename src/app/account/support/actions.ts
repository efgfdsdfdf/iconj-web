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

  const name = user.user_metadata?.full_name || user.email;

  // Send an email to the admin
  const htmlContent = `
    <h2>New Support Message</h2>
    <p><strong>From:</strong> ${name} (${user.email})</p>
    <p><strong>Message:</strong></p>
    <blockquote style="border-left: 4px solid #ccc; padding-left: 10px; margin-left: 0;">${message}</blockquote>
    <br/>
    <p><a href="${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/admin/support">Reply in Admin Dashboard</a></p>
  `;
  await sendAdminNotification(`💬 New Message from ${name}`, htmlContent).catch(console.error);

  revalidatePath("/account/support");
  return { success: true };
}
