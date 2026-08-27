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

  // Fetch users directly from Supabase Auth since profiles table might be empty
  const { data: authData } = await supabaseAdmin.auth.admin.listUsers();
  const users = authData?.users || [];

  const profileMap: Record<string, any> = {};
  users.forEach((u: any) => { 
    profileMap[u.id] = {
      id: u.id,
      email: u.email,
      full_name: u.user_metadata?.full_name || u.user_metadata?.name || null
    }; 
  });

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

  // Fetch the customer's email directly from Auth
  const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(userId);

  if (user?.email) {
    const customerName = user.user_metadata?.full_name || user.user_metadata?.name || "Customer";
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
