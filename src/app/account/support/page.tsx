import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SupportChatClient } from "./SupportChatClient";

export const revalidate = 0;

export default async function SupportPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  let messages = [];
  try {
    const res = await supabase
      .from("support_messages")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    if (res.data) messages = res.data;
  } catch (e) {
    console.error("Support messages table not found");
  }

  // Fullscreen WhatsApp style
  return (
    <div className="bg-slate-50 min-h-[calc(100vh-64px)] flex flex-col fixed inset-0 z-50 top-[64px] md:top-[80px]">
      <SupportChatClient initialMessages={messages || []} userId={user.id} />
    </div>
  );
}
