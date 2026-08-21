import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Box, LayoutDashboard, Settings, ShoppingCart, Users, Truck, Menu, AlertCircle, Image as ImageIcon, WalletCards, LogOut } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

function AdminNavLinks() {
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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // STRICT ADMIN ACCESS CONTROL
  if (!user || user.email !== "ezeilodavid292@gmail.com") {
    redirect("/account");
  }

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-130px)] bg-slate-50">
      
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between bg-slate-900 p-4">
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
      <aside className="w-64 bg-slate-900 text-slate-300 hidden md:block shrink-0">
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
        {children}
      </div>
    </div>
  );
}
