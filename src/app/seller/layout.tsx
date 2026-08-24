import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Package, ShoppingCart, DollarSign, Store, LogOut } from "lucide-react";
import { LogoutButton } from "@/app/account/LogoutButton";

export default async function SellerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Verify they have the seller role
  const { data: userRole } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "seller")
    .single();

  // If not seller, redirect to their account page
  if (!userRole) {
    redirect("/account");
  }

  // Get their seller profile
  const { data: seller } = await supabase
    .from("sellers")
    .select("*, stores(store_name)")
    .eq("profile_id", user.id)
    .single();

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 hidden md:flex flex-col shrink-0">
        <div className="h-16 flex items-center px-6 bg-slate-950 font-bold text-white tracking-wider border-b border-slate-800">
          ICON SELLER
        </div>
        <div className="p-4 border-b border-slate-800">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Store</p>
          <p className="text-sm text-white font-medium truncate">{seller?.stores?.[0]?.store_name || "My Store"}</p>
        </div>
        <nav className="flex-1 py-6 px-3 space-y-1">
          <Link href="/seller" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-slate-800 hover:text-white transition-colors">
            <LayoutDashboard className="w-5 h-5 text-slate-400" /> Dashboard
          </Link>
          <Link href="/seller/orders" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-slate-800 hover:text-white transition-colors">
            <ShoppingCart className="w-5 h-5 text-slate-400" /> Orders
          </Link>
          <Link href="/seller/products" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-slate-800 hover:text-white transition-colors">
            <Package className="w-5 h-5 text-slate-400" /> Products
          </Link>
          <Link href="/seller/payouts" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-slate-800 hover:text-white transition-colors">
            <DollarSign className="w-5 h-5 text-slate-400" /> Payouts
          </Link>
          <Link href="/seller/store" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-slate-800 hover:text-white transition-colors">
            <Store className="w-5 h-5 text-slate-400" /> Store Settings
          </Link>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <LogoutButton />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b shadow-sm flex items-center px-4 md:px-8 shrink-0">
          <h1 className="text-lg font-semibold text-slate-800 md:hidden">Seller Portal</h1>
          <div className="ml-auto flex items-center gap-4">
            <Link href="/" className="text-sm text-blue-600 hover:underline">Back to Main Site</Link>
          </div>
        </header>
        <div className="flex-1 p-4 md:p-8 overflow-auto">
          {seller?.status !== 'approved' && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg flex items-start gap-3">
              <div className="mt-0.5">⚠️</div>
              <div>
                <h3 className="font-bold">Account Pending Approval</h3>
                <p className="text-sm mt-1">Your seller account is currently {seller?.status.replace('_', ' ')}. You can set up your store and draft products, but they won't be visible to customers until an admin approves your application.</p>
              </div>
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
