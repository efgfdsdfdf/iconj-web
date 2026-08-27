import { createClient } from "@supabase/supabase-js";
import { AdminChatDashboard } from "./AdminChatDashboard";

export const revalidate = 0;

export default async function AdminSupportPage() {
  const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  // Fetch all support messages with the user details
  let messages = [];
  try {
    const res = await supabaseAdmin
      .from("support_messages")
      .select("*, profiles:user_id(full_name, email)")
      .order("created_at", { ascending: true });
    if (res.data) messages = res.data;
  } catch (e) {
    console.error("Support messages table not found");
  }

  return (
    <main className="flex-1 bg-slate-50 flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      <AdminChatDashboard initialMessages={messages || []} />
    </main>
  );
}
