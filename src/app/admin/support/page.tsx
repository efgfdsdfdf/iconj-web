import { createClient } from "@supabase/supabase-js";
import { AdminChatDashboard } from "./AdminChatDashboard";

export const revalidate = 0;

export default async function AdminSupportPage() {
  const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  let messages: any[] = [];
  try {
    // Fetch messages WITHOUT the broken join
    const { data: rawMessages } = await supabaseAdmin
      .from("support_messages")
      .select("*")
      .order("created_at", { ascending: true });

    if (rawMessages && rawMessages.length > 0) {
      // Get unique user IDs
      const userIds = Array.from(new Set(rawMessages.map(m => m.user_id)));
      
      // Fetch profiles separately
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);
      
      // Build a lookup map
      const profileMap: Record<string, any> = {};
      if (profiles) {
        profiles.forEach(p => { profileMap[p.id] = p; });
      }
      
      // Merge profiles into messages
      messages = rawMessages.map(m => ({
        ...m,
        profiles: profileMap[m.user_id] || null
      }));
    }
  } catch (e) {
    console.error("Support messages fetch error:", e);
  }

  return (
    <main className="flex-1 bg-slate-50 flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      <AdminChatDashboard initialMessages={messages} />
    </main>
  );
}
