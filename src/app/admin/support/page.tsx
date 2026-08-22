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
      .select("*, profiles(name, email)")
      .order("created_at", { ascending: true });
    if (res.data) messages = res.data;
  } catch (e) {
    console.error("Support messages table not found");
  }

  return (
    <main className="flex-1 p-4 md:p-8 bg-slate-50 min-h-screen h-[calc(100vh-60px)]">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Support Inbox</h1>
          <p className="text-sm text-slate-500">Live chat with your customers.</p>
        </div>
      </div>
      <div className="h-[calc(100%-80px)]">
        <AdminChatDashboard initialMessages={messages || []} />
      </div>
    </main>
  );
}
