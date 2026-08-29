import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ShoppingCart, DollarSign, TrendingUp, CheckCircle2, ArrowRight, Wallet, Store, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default async function SellerDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: seller } = await supabaseAdmin
    .from("sellers")
    .select("id, status, created_at, seller_identifier, stores(store_name)")
    .eq("profile_id", user?.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!seller) return <div>Seller not found.</div>;

  // Check payout account
  const { data: payoutAccount } = await supabaseAdmin
    .from("seller_payout_accounts")
    .select("id, status, paystack_subaccount_code")
    .eq("seller_id", seller.id)
    .eq("is_primary", true)
    .maybeSingle();

  // Fetch stats
  const { count: orderCount } = await supabaseAdmin
    .from("seller_orders")
    .select("*", { count: 'exact', head: true })
    .eq("seller_id", seller.id);

  const { count: productCount } = await supabaseAdmin
    .from("products")
    .select("*", { count: 'exact', head: true })
    .eq("seller_id", seller.id);

  // Fetch financial summary from ledger and wallet
  const { data: ledger } = await supabaseAdmin
    .from("financial_ledger")
    .select("transaction_type, amount")
    .eq("seller_id", seller.id);

  const { data: wallet } = await supabaseAdmin
    .from("seller_wallets")
    .select("available_balance, pending_balance, reserved_balance, total_earned")
    .eq("seller_id", seller.id)
    .maybeSingle();

  let totalGross = 0;
  let totalCommission = 0;
  let netFromLedger = 0;
  let pendingSettlement = 0;

  ledger?.forEach(entry => {
    const amt = Number(entry.amount);
    if (entry.transaction_type === 'SALE_GROSS') totalGross += amt;
    if (entry.transaction_type === 'ICONJ_COMMISSION') totalCommission += Math.abs(amt);
    if (entry.transaction_type === 'SELLER_EARNING') netFromLedger += amt;
    if (entry.transaction_type === 'SETTLEMENT_PENDING') {
      netFromLedger += amt;
      pendingSettlement += amt;
    }
    if (entry.transaction_type === 'SETTLEMENT_SUCCESSFUL') {
      pendingSettlement -= amt;
    }
  });

  // Calculate true net earnings (using wallet, or ledger settlements, or gross minus commission)
  const totalEarnings = wallet && Number(wallet.total_earned) > 0
    ? Number(wallet.total_earned)
    : (netFromLedger > 0 ? netFromLedger : Math.max(0, totalGross - totalCommission));

  // If wallet exists with funds, use wallet balances for pending payout
  if (wallet && (Number(wallet.available_balance) > 0 || Number(wallet.pending_balance) > 0)) {
    pendingSettlement = Number(wallet.available_balance) + Number(wallet.pending_balance);
  }

  const formatCurrency = (val: number) => `₦${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Fetch recent orders with customer profile join
  const { data: recentOrders } = await supabaseAdmin
    .from("seller_orders")
    .select("*, orders(id, delivery_address, payment_status, created_at, user_id, profiles:user_id(name, email, phone))")
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
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 shadow-md">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="w-9 h-9 sm:w-12 sm:h-12 bg-white/20 rounded-xl sm:rounded-full flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle2 className="w-5 h-5 sm:w-7 sm:h-7" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5 mb-1 sm:mb-1.5">
                <h2 className="text-base sm:text-xl md:text-2xl font-bold tracking-tight">
                  Welcome to ICONJ Seller Center! 🎉
                </h2>
                {seller.seller_identifier && (
                  <span className="bg-emerald-950/40 text-emerald-100 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-mono font-bold border border-emerald-400/30">
                    {seller.seller_identifier}
                  </span>
                )}
              </div>
              <p className="text-emerald-100 text-xs sm:text-sm md:text-base mb-3 sm:mb-5 leading-snug">
                Your seller application has been approved. Complete setup to start selling on ICONJ.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3.5">
                {/* Step 1: Store */}
                <div className={`rounded-lg sm:rounded-xl p-2.5 sm:p-4 flex sm:flex-col items-center sm:items-start justify-between sm:justify-start gap-2 ${hasStore ? 'bg-white/20' : 'bg-white/10 border border-dashed border-white/30'}`}>
                  <div className="flex items-center gap-2 min-w-0">
                    {hasStore ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
                    ) : (
                      <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border border-white/60 text-center text-[10px] sm:text-xs leading-4 sm:leading-5 font-bold shrink-0">1</span>
                    )}
                    <div className="min-w-0">
                      <span className="font-semibold text-xs sm:text-sm block truncate">Store Setup</span>
                      <p className="text-[10px] sm:text-xs text-emerald-200 hidden sm:block">
                        {hasStore ? 'Complete ✓' : 'Configure your store details'}
                      </p>
                    </div>
                  </div>
                  {hasStore ? (
                    <span className="text-[11px] sm:hidden text-emerald-200 font-medium shrink-0">Complete ✓</span>
                  ) : (
                    <Link 
                      href="/seller/store" 
                      className="text-[11px] sm:text-xs font-medium px-2.5 py-1 sm:px-0 sm:py-0 bg-white sm:bg-transparent text-emerald-800 sm:text-white rounded sm:rounded-none shrink-0 sm:mt-2 inline-flex items-center gap-1 sm:underline"
                    >
                      Configure <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>

                {/* Step 2: Products */}
                <div className={`rounded-lg sm:rounded-xl p-2.5 sm:p-4 flex sm:flex-col items-center sm:items-start justify-between sm:justify-start gap-2 ${hasProducts ? 'bg-white/20' : 'bg-white/10 border border-dashed border-white/30'}`}>
                  <div className="flex items-center gap-2 min-w-0">
                    {hasProducts ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
                    ) : (
                      <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border border-white/60 text-center text-[10px] sm:text-xs leading-4 sm:leading-5 font-bold shrink-0">2</span>
                    )}
                    <div className="min-w-0">
                      <span className="font-semibold text-xs sm:text-sm block truncate">Add Products</span>
                      <p className="text-[10px] sm:text-xs text-emerald-200 hidden sm:block">
                        {hasProducts ? `${productCount} listed ✓` : 'List your first product'}
                      </p>
                    </div>
                  </div>
                  {hasProducts ? (
                    <span className="text-[11px] sm:hidden text-emerald-200 font-medium shrink-0">{productCount} listed ✓</span>
                  ) : (
                    <Link 
                      href="/seller/products" 
                      className="text-[11px] sm:text-xs font-medium px-2.5 py-1 sm:px-0 sm:py-0 bg-white sm:bg-transparent text-emerald-800 sm:text-white rounded sm:rounded-none shrink-0 sm:mt-2 inline-flex items-center gap-1 sm:underline"
                    >
                      Add Product <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>

                {/* Step 3: Payout */}
                <div className={`rounded-lg sm:rounded-xl p-2.5 sm:p-4 flex sm:flex-col items-center sm:items-start justify-between sm:justify-start gap-2 ${hasPayout ? 'bg-white/20' : 'bg-white/10 border border-dashed border-white/30'}`}>
                  <div className="flex items-center gap-2 min-w-0">
                    {hasPayout ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
                    ) : (
                      <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border border-white/60 text-center text-[10px] sm:text-xs leading-4 sm:leading-5 font-bold shrink-0">3</span>
                    )}
                    <div className="min-w-0">
                      <span className="font-semibold text-xs sm:text-sm block truncate">Payout Account</span>
                      <p className="text-[10px] sm:text-xs text-emerald-200 hidden sm:block">
                        {hasPayout ? 'Bank linked ✓' : 'Link bank account'}
                      </p>
                    </div>
                  </div>
                  {hasPayout ? (
                    <span className="text-[11px] sm:hidden text-emerald-200 font-medium shrink-0">Linked ✓</span>
                  ) : (
                    <Link 
                      href="/seller/payouts" 
                      className="text-[11px] sm:text-xs font-medium px-2.5 py-1 sm:px-0 sm:py-0 bg-white sm:bg-transparent text-emerald-800 sm:text-white rounded sm:rounded-none shrink-0 sm:mt-2 inline-flex items-center gap-1 sm:underline"
                    >
                      Link Bank <ArrowRight className="w-3 h-3" />
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

        <Link href="/seller/wallet">
          <Card className="hover:border-emerald-500 transition-colors cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center shrink-0">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Available Balance</p>
                <h3 className="text-2xl font-bold text-emerald-600">{formatCurrency(wallet?.available_balance || 0)}</h3>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/seller/wallet">
          <Card className="hover:border-amber-500 transition-colors cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center shrink-0">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Pending (Clearing)</p>
                <h3 className="text-2xl font-bold text-amber-600">{formatCurrency(wallet?.pending_balance || 0)}</h3>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center shrink-0">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Products</p>
              <h3 className="text-2xl font-bold text-slate-900">{productCount || 0}</h3>
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
                  {recentOrders.map((order: any) => {
                    const addr = order.orders?.delivery_address || {};
                    const customerName =
                      (addr.name && addr.name.trim().length > 0 ? addr.name.trim() : null) ||
                      order.orders?.profiles?.name ||
                      (addr.email && addr.email.trim().length > 0 ? addr.email.trim() : null) ||
                      order.orders?.profiles?.email ||
                      'Customer';

                    const customerSub = addr.city || (addr.email && addr.email !== customerName ? addr.email : null);

                    return (
                      <tr key={order.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">{order.id.split('-')[0].toUpperCase()}</td>
                        <td className="px-4 py-3 text-slate-500">{new Date(order.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">{customerName}</div>
                          {customerSub && <div className="text-xs text-slate-500">{customerSub}</div>}
                        </td>
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
                    );
                  })}
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
