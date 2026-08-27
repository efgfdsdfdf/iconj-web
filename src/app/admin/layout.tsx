import { redirect } from "next/navigation";
import Link from "next/link";
import { Box, LayoutDashboard, Settings, ShoppingCart, Users, Truck, Menu, AlertCircle, Image as ImageIcon, WalletCards, MessageCircle } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { verifyAdmin } from "@/lib/auth/admin";
import { RealtimeAdminUpdates } from "@/components/admin/RealtimeAdminUpdates";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { createClient } from "@supabase/supabase-js";

async function AdminNavLinks() {
  const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  // Count unread support messages (messages from users that haven't been replied to yet)
  // We approximate this by counting unique user_ids where the latest message is not from admin
  // Since we don't have an is_read column on support_messages, this is a simplified version.
  // Actually, let's just add the link without the dynamic badge first to avoid slowing down layout render.
  
  return (
    <nav className="space-y-1 text-sm font-medium">
      <Link href="/admin" className="flex items-center gap-3 hover:bg-white/5 hover:text-white px-4 py-2.5 rounded-lg transition-colors">
        <LayoutDashboard className="w-5 h-5" /> Dashboard
      </Link>
      <Link href="/admin/orders" className="flex items-center gap-3 hover:bg-white/5 hover:text-white px-4 py-2.5 rounded-lg transition-colors">
        <ShoppingCart className="w-5 h-5" /> Orders
      </Link>
      <Link href="/admin/products" className="flex items-center gap-3 hover:bg-white/5 hover:text-white px-4 py-2.5 rounded-lg transition-colors">
        <Box className="w-5 h-5" /> Products
      </Link>
      <Link href="/admin/supplier" className="flex items-center gap-3 hover:bg-white/5 hover:text-white px-4 py-2.5 rounded-lg transition-colors">
        <Truck className="w-5 h-5" /> Supplier Balance
      </Link>
      <Link href="/admin/issues" className="flex items-center gap-3 hover:bg-white/5 hover:text-white px-4 py-2.5 rounded-lg transition-colors text-orange-400">
        <AlertCircle className="w-5 h-5" /> Order Issues
      </Link>
      <Link href="/admin/support" className="flex items-center gap-3 hover:bg-white/5 hover:text-white px-4 py-2.5 rounded-lg transition-colors text-blue-400">
        <MessageCircle className="w-5 h-5" /> Support Inbox
      </Link>
      <Link href="/admin/sellers" className="flex items-center gap-3 hover:bg-white/5 hover:text-white px-4 py-2.5 rounded-lg transition-colors">
        <Users className="w-5 h-5" /> Sellers
      </Link>
      <Link href="/admin/payouts" className="flex items-center gap-3 hover:bg-white/5 hover:text-white px-4 py-2.5 rounded-lg transition-colors">
        <WalletCards className="w-5 h-5" /> Seller Payouts
      </Link>
      <Link href="/admin/categories" className="flex items-center gap-3 hover:bg-white/5 hover:text-white px-4 py-2.5 rounded-lg transition-colors">
        <ImageIcon className="w-5 h-5" /> Categories
      </Link>
      <Link href="/admin/customers" className="flex items-center gap-3 hover:bg-white/5 hover:text-white px-4 py-2.5 rounded-lg transition-colors">
        <Users className="w-5 h-5" /> Customers
      </Link>
      <Link href="/admin/settings" className="flex items-center gap-3 hover:bg-white/5 hover:text-white px-4 py-2.5 rounded-lg transition-colors">
        <Settings className="w-5 h-5" /> Settings
      </Link>
    </nav>
  );
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // STRICT ADMIN ACCESS CONTROL using the centralized helper
  const { isAdmin } = await verifyAdmin();
  if (!isAdmin) {
    redirect("/account");
  }

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-130px)] bg-slate-50 relative">
      <RealtimeAdminUpdates />
      
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between bg-slate-900 p-4 sticky top-0 z-30">
        <div>
          <h2 className="text-white font-bold tracking-tight">ICONJ Admin</h2>
        </div>
        <Sheet>
          <SheetTrigger className="text-white p-2 -mr-2">
            <Menu className="w-6 h-6" />
          </SheetTrigger>
          <SheetContent side="left" className="bg-slate-900 border-r-slate-800 text-slate-300 p-6 w-[280px]">
            <div className="mb-8">
              <h2 className="text-white font-bold text-lg tracking-tight">ICONJ Admin</h2>
              <p className="text-xs text-slate-500">Superuser Portal</p>
            </div>
            <AdminNavLinks />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 hidden md:block shrink-0 z-10">
        <div className="p-6 fixed w-64 h-[calc(100vh-130px)] overflow-y-auto">
          <div className="mb-8">
            <h2 className="text-white font-bold text-lg tracking-tight">ICONJ Admin</h2>
            <p className="text-xs text-slate-500">Superuser Portal</p>
          </div>
          <AdminNavLinks />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col w-full overflow-hidden">
        <AdminHeader />
        {children}
      </div>
    </div>
  );
}
