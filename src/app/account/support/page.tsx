import { Card, CardContent } from "@/components/ui/card";
import { User, Package, MapPin, AlertCircle, MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SupportChatClient } from "./SupportChatClient";

export const revalidate = 0;

export default async function SupportPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Load chat history
  const { data: messages } = await supabase
    .from("support_messages")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .catch(() => ({ data: [] })); // Fails safely if table doesn't exist yet

  return (
    <div className="bg-slate-50 min-h-screen pb-12">
      <div className="bg-white border-b shadow-sm mb-8">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-slate-900">Contact Support</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar Navigation */}
          <div className="w-full lg:w-64 shrink-0">
            <Card className="border-none shadow-sm overflow-hidden">
              <nav className="flex flex-col">
                <Link href="/account" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 border-l-4 border-transparent text-slate-700 font-medium">
                  <User className="w-5 h-5 text-slate-500" /> Account Overview
                </Link>
                <Link href="/account/orders" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 border-l-4 border-transparent text-slate-700 font-medium border-t">
                  <Package className="w-5 h-5 text-slate-400" /> My Orders
                </Link>
                <Link href="/account/addresses" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 border-l-4 border-transparent text-slate-700 font-medium border-t">
                  <MapPin className="w-5 h-5 text-slate-400" /> Saved Addresses
                </Link>
                <Link href="/account/issues" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 border-l-4 border-transparent text-slate-700 font-medium border-t">
                  <AlertCircle className="w-5 h-5 text-slate-400" /> Returns & Issues
                </Link>
                <Link href="/account/support" className="flex items-center gap-3 px-4 py-3 bg-slate-100 border-l-4 border-blue-500 font-bold text-slate-900 border-t">
                  <MessageCircle className="w-5 h-5 text-blue-500" /> Contact Support
                </Link>
              </nav>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <SupportChatClient initialMessages={messages || []} userId={user.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
