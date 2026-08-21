import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, ShoppingBag, Users, Truck, Settings, WalletCards, Package, LogOut } from "lucide-react";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // STRICT ADMIN ACCESS CONTROL
  if (!user || user.email !== "ezeilodavid292@gmail.com") {
    redirect("/account");
  }

  return (
    <div className="flex min-h-[calc(100vh-130px)] bg-slate-50">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 text-slate-300 hidden md:block">
        <div className="p-6">
          <div className="mb-8">
            <h2 className="text-white font-bold text-lg tracking-tight">ICONJ Admin</h2>
            <p className="text-xs text-slate-500">Superuser Portal</p>
          </div>

          <nav className="space-y-1 text-sm font-medium">
            <Link href="/admin" className="flex items-center gap-3 hover:bg-white/5 hover:text-white px-4 py-2.5 rounded-lg transition-colors">
              <LayoutDashboard className="w-5 h-5" /> Dashboard
            </Link>
            <Link href="/admin/orders" className="flex items-center gap-3 hover:bg-white/5 hover:text-white px-4 py-2.5 rounded-lg transition-colors">
              <ShoppingBag className="w-5 h-5" /> Orders
            </Link>
            <Link href="/admin/products" className="flex items-center gap-3 hover:bg-white/5 hover:text-white px-4 py-2.5 rounded-lg transition-colors">
              <Package className="w-5 h-5" /> Products
            </Link>
            <Link href="/admin/supplier" className="flex items-center gap-3 hover:bg-white/5 hover:text-white px-4 py-2.5 rounded-lg transition-colors">
              <Truck className="w-5 h-5" /> Supplier Balance
            </Link>
            <Link href="/admin/customers" className="flex items-center gap-3 hover:bg-white/5 hover:text-white px-4 py-2.5 rounded-lg transition-colors">
              <Users className="w-5 h-5" /> Customers
            </Link>
            <Link href="/admin/settings" className="flex items-center gap-3 hover:bg-white/5 hover:text-white px-4 py-2.5 rounded-lg transition-colors">
              <Settings className="w-5 h-5" /> Settings
            </Link>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
}
