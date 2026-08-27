"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

export async function fetchAllMessages() {
  const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  const { data: rawMessages } = await supabaseAdmin
    .from("support_messages")
    .select("*")
    .order("created_at", { ascending: true });

  if (!rawMessages || rawMessages.length === 0) return [];

  const userIds = Array.from(new Set(rawMessages.map((m: any) => m.user_id)));
  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, email")
    .in("id", userIds);

  const profileMap: Record<string, any> = {};
  if (profiles) profiles.forEach((p: any) => { profileMap[p.id] = p; });

  return rawMessages.map((m: any) => ({ ...m, profiles: profileMap[m.user_id] || null }));
}

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
    
    // Send email using our mailer
    try {
      const { sendEmailTo } = await import("@/lib/email");
      await sendEmailTo(profile.email, "New reply from ICONJ Support", htmlContent);
    } catch (e) {
      console.error("Failed to send customer notification email:", e);
    }
  }

  revalidatePath("/admin/support");
  return { success: true };
}
