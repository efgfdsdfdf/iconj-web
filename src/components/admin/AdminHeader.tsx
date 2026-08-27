import Link from "next/link";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export async function AdminHeader() {
  let unreadCount = 0;
  
  try {
    const supabase = await createClient();
    const { count } = await supabase
      .from("admin_notifications")
      .select("*", { count: "exact", head: true })
      .eq("is_read", false);
    unreadCount = count || 0;
  } catch (e) {
    // Silently handle - notifications table may not exist
  }

  return (
    <div className="bg-white border-b px-6 py-3 flex items-center justify-between sticky top-0 z-20 shadow-sm">
      <div className="hidden md:block">
        <h1 className="text-sm font-semibold text-slate-800">Operational View</h1>
      </div>
      <div className="flex items-center gap-4 ml-auto">
        <Link href="/admin/support" className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>
      </div>
    </div>
  );
}
