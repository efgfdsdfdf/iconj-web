import { AdminChatDashboard } from "./AdminChatDashboard";
import { fetchAllMessages } from "./actions";

export const revalidate = 0;

export default async function AdminSupportPage() {
  let messages: any[] = [];
  try {
    messages = await fetchAllMessages();
  } catch (e) {
    console.error("Support messages fetch error:", e);
  }

  return (
    <main className="flex-1 bg-slate-50 flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      <AdminChatDashboard initialMessages={messages} />
    </main>
  );
}
