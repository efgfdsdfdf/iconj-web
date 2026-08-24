import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ShoppingCart, DollarSign, TrendingUp, CheckCircle2, ArrowRight, Wallet, Store, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default async function SellerDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: seller } = await supabase
    .from("sellers")
    .select("id, status, created_at, stores(store_name)")
    .eq("profile_id", user?.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!seller) return <div>Seller not found.</div>;

  // Check payout account
  const { data: payoutAccount } = await supabase
    .from("seller_payout_accounts")
    .select("id, status, paystack_subaccount_code")
    .eq("seller_id", seller.id)
    .eq("is_primary", true)
    .maybeSingle();

  // Fetch stats
  const { count: orderCount } = await supabase
    .from("seller_orders")
    .select("*", { count: 'exact', head: true })
    .eq("seller_id", seller.id);

  const { count: productCount } = await supabase
    .from("products")
    .select("*", { count: 'exact', head: true })
    .eq("seller_id", seller.id);

  // Fetch financial summary from ledger
  const { data: ledger } = await supabase
    .from("financial_ledger")
    .select("transaction_type, amount")
    .eq("seller_id", seller.id);

  let totalEarnings = 0;
  let pendingSettlement = 0;
  ledger?.forEach(entry => {
    const amt = Number(entry.amount);
    if (entry.transaction_type === 'SELLER_EARNING') totalEarnings += amt;
    if (entry.transaction_type === 'SETTLEMENT_PENDING') pendingSettlement += amt;
    if (entry.transaction_type === 'SETTLEMENT_SUCCESSFUL') pendingSettlement -= amt;
  });

  const formatCurrency = (val: number) => `₦${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Fetch recent orders
  const { data: recentOrders } = await supabase
    .from("seller_orders")
    .select("*, orders(delivery_address, payment_status, created_at)")
    .eq("seller_id", seller.id)
    .order("created_at", { ascending: false })
    .limit(5);

  // Setup checklist
  const hasStore = !!seller.stores?.[0]?.store_name;
  const hasProducts = (productCount || 0) > 0;
  const hasPayout = !!payoutAccount;
  const setupComplete = hasStore && hasProducts && hasPayout;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Welcome Banner (shown for newly approved sellers) */}
      {!setupComplete && (
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl p-8 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Welcome to the ICONJ Seller Center! 🎉</h2>
              <p className="text-emerald-100 text-lg mb-6">
                Your seller application has been approved. Complete the setup steps below to start selling on ICONJ.
              </p>
              
              <div className="grid sm:grid-cols-3 gap-4">
                <div className={`rounded-xl p-4 ${hasStore ? 'bg-white/20' : 'bg-white/10 border-2 border-dashed border-white/30'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {hasStore ? <CheckCircle2 className="w-4 h-4 text-emerald-200" /> : <span className="w-5 h-5 rounded-full border-2 border-white/50 text-center text-xs leading-5 font-bold">1</span>}
                    <span className="font-semibold text-sm">Store Setup</span>
                  </div>
                  <p className="text-xs text-emerald-200">{hasStore ? 'Complete ✓' : 'Configure your store details'}</p>
                  {!hasStore && (
                    <Link href="/seller/store" className="text-xs mt-2 inline-flex items-center gap-1 text-white underline">
                      Go to Store Settings <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>

                <div className={`rounded-xl p-4 ${hasProducts ? 'bg-white/20' : 'bg-white/10 border-2 border-dashed border-white/30'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {hasProducts ? <CheckCircle2 className="w-4 h-4 text-emerald-200" /> : <span className="w-5 h-5 rounded-full border-2 border-white/50 text-center text-xs leading-5 font-bold">2</span>}
                    <span className="font-semibold text-sm">Add Products</span>
                  </div>
                  <p className="text-xs text-emerald-200">{hasProducts ? `${productCount} product(s) listed ✓` : 'List your first product'}</p>
                  {!hasProducts && (
                    <Link href="/seller/products" className="text-xs mt-2 inline-flex items-center gap-1 text-white underline">
                      Go to Products <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>

                <div className={`rounded-xl p-4 ${hasPayout ? 'bg-white/20' : 'bg-white/10 border-2 border-dashed border-white/30'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {hasPayout ? <CheckCircle2 className="w-4 h-4 text-emerald-200" /> : <span className="w-5 h-5 rounded-full border-2 border-white/50 text-center text-xs leading-5 font-bold">3</span>}
                    <span className="font-semibold text-sm">Payout Account</span>
                  </div>
                  <p className="text-xs text-emerald-200">{hasPayout ? 'Bank account linked ✓' : 'Link your bank for payouts'}</p>
                  {!hasPayout && (
                    <Link href="/seller/payouts" className="text-xs mt-2 inline-flex items-center gap-1 text-white underline">
                      Link Bank Account <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Orders</p>
              <h3 className="text-2xl font-bold text-slate-900">{orderCount || 0}</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center shrink-0">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Net Earnings</p>
              <h3 className="text-2xl font-bold text-slate-900">{formatCurrency(totalEarnings)}</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center shrink-0">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Products</p>
              <h3 className="text-2xl font-bold text-slate-900">{productCount || 0}</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center shrink-0">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Pending Payout</p>
              <h3 className="text-2xl font-bold text-slate-900">{formatCurrency(pendingSettlement)}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Orders</CardTitle>
          <Link href="/seller/orders" className="text-sm text-blue-600 hover:underline">View All</Link>
        </CardHeader>
        <CardContent>
          {recentOrders && recentOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-y">
                  <tr>
                    <th className="px-4 py-3">Order ID</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {recentOrders.map((order: any) => (
                    <tr key={order.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">{order.id.split('-')[0]}</td>
                      <td className="px-4 py-3 text-slate-500">{new Date(order.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3">{order.orders?.delivery_address?.name || 'Unknown'}</td>
                      <td className="px-4 py-3 font-medium">₦{order.total_amount?.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          order.status === 'PAID' || order.status === 'PROCESSING' ? 'bg-emerald-100 text-emerald-700' :
                          order.status === 'PENDING_PAYMENT' ? 'bg-amber-100 text-amber-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500">
              No orders yet. Once customers purchase your products, they will appear here.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
