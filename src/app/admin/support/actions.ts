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

  revalidatePath("/admin/support");
  return { success: true };
}
