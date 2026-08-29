import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Package, ShoppingCart, DollarSign, Store, LogOut, CheckCircle, XCircle } from "lucide-react";
import { LogoutButton } from "@/app/account/LogoutButton";
import { MobileSidebar } from "./MobileSidebar";

export default async function SellerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get their seller profile
  const { data: seller } = await supabase
    .from("sellers")
    .select("*, stores(store_name)")
    .eq("profile_id", user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // If not a seller, redirect to their account page
  if (!seller) {
    redirect("/account");
  }

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
          <Link href="/seller/finance" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-slate-800 hover:text-white transition-colors">
            <DollarSign className="w-5 h-5 text-slate-400" /> Finance Ledger
          </Link>
          <Link href="/seller/wallet" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-slate-800 hover:text-white transition-colors">
            <DollarSign className="w-5 h-5 text-emerald-400" /> Wallet
          </Link>
          <Link href="/seller/payouts" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-slate-800 hover:text-white transition-colors">
            <DollarSign className="w-5 h-5 text-slate-400" /> Payout Account
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
          <MobileSidebar storeName={seller?.stores?.[0]?.store_name || "My Store"} />
          <h1 className="text-lg font-semibold text-slate-800 md:hidden">Seller Portal</h1>
          <div className="ml-auto flex items-center gap-4">
            <Link href="/" className="text-sm text-blue-600 hover:underline">Back to Main Site</Link>
          </div>
        </header>
        <div className="flex-1 p-4 md:p-8 overflow-auto">
          {seller?.status === 'pending_verification' ? (
            <div className="max-w-2xl mx-auto mt-12 text-center bg-white p-12 rounded-2xl shadow-sm border">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Application Submitted Successfully!</h2>
              <p className="text-lg text-slate-600 mb-8">
                Your KYC documents and business profile have been securely sent to the ICONJ compliance team for review. 
                We will notify you once your account is fully verified.
              </p>
              <div className="bg-blue-50 p-6 rounded-lg text-left border border-blue-100">
                <h3 className="font-bold text-blue-900 mb-2">What happens next?</h3>
                <ul className="list-disc list-inside text-blue-800 space-y-2">
                  <li>An admin will review your uploaded CAC and ID documents.</li>
                  <li>Your bank details will be verified for automatic payout capability.</li>
                  <li>Once approved, this dashboard will unlock and you can start listing products!</li>
                </ul>
              </div>
            </div>
          ) : seller?.status === 'rejected' ? (
            <div className="max-w-2xl mx-auto mt-12 text-center bg-white p-12 rounded-2xl shadow-sm border">
              <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Application Rejected</h2>
              <p className="text-lg text-slate-600 mb-8">
                Unfortunately, your seller application was not approved by the ICONJ compliance team. 
                Please ensure your KYC documents are clear, valid, and exactly match your provided business details.
              </p>
              
              <form action={async () => {
                "use server";
                const supabaseAdmin = await createClient(); // Need admin client to delete
                const adminClient = require('@supabase/supabase-js').createClient(
                  process.env.NEXT_PUBLIC_SUPABASE_URL!,
                  process.env.SUPABASE_SERVICE_ROLE_KEY!
                );
                
                // Delete the rejected seller and business to allow a fresh start
                if (seller?.business_id) {
                   await adminClient.from('businesses').delete().eq('id', seller.business_id);
                }
                if (seller?.id) {
                   await adminClient.from('sellers').delete().eq('id', seller.id);
                }
                
                // Also remove the seller role
                await adminClient.from('user_roles').delete().eq('user_id', user.id).eq('role', 'seller');
                
                const { redirect } = await import('next/navigation');
                redirect("/onboarding/seller");
              }}>
                <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-8 rounded-lg shadow-sm transition-colors">
                  Start New Application
                </button>
              </form>
            </div>
          ) : (
            children
          )}
        </div>
      </main>
    </div>
  );
}
