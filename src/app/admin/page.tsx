import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WalletCards, ShoppingBag, Users, Truck, TrendingUp, AlertTriangle, Package, CircleDot, AlertCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/auth/admin";

export const revalidate = 0;

export default async function AdminDashboardPage() {
  await requireAdmin();
  const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  // Base metrics
  const { count: productCount } = await supabaseAdmin.from("products").select("*", { count: "exact", head: true });
  const { count: userCount } = await supabaseAdmin.from("profiles").select("*", { count: "exact", head: true });
  const { data: recentOrders } = await supabaseAdmin.from("orders").select("id, created_at, order_status, payment_status, total_amount").order("created_at", { ascending: false }).limit(5);
  
  // Comprehensive Order & Financial Fetch
  const { data: allOrders } = await supabaseAdmin.from("orders").select("id, total_amount, shipping_cost, supplier_cost, estimated_profit, order_status, payment_status, admin_viewed, supplier_order_status");
  const orders = allOrders || [];

  // 1. Needs Attention Aggregates
  const unviewedOrders = orders.filter(o => !o.admin_viewed).length;
  const paidUnprocessed = orders.filter(o => o.payment_status === 'PAID' && o.order_status === 'PAYMENT_CONFIRMED').length;
  const readyForSupplier = orders.filter(o => o.order_status === 'READY_FOR_SUPPLIER' && o.supplier_order_status === 'NOT_SENT').length;
  const supplierPaymentPending = orders.filter(o => o.supplier_order_status === 'PAYMENT_PENDING').length;
  const { count: issuesCount } = await supabaseAdmin.from("issues").select("*", { count: "exact", head: true }).eq("status", "OPEN");

  // 2. Financial Aggregates
  const paidOrders = orders.filter(o => o.payment_status === 'PAID');
  const totalRevenue = paidOrders.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0);
  const totalSupplierCost = paidOrders.reduce((sum, order) => sum + (Number(order.supplier_cost) || 0), 0);
  const totalFees = 0; // Future fee calculation
  const totalProfit = paidOrders.reduce((sum, order) => sum + (Number(order.estimated_profit) || 0), 0);

  // 3. Supplier Ledger Aggregates
  // We fetch the latest balance of all suppliers
  const { data: latestBalances } = await supabaseAdmin
    .from("supplier_transactions")
    .select("supplier_id, new_balance")
    .order("sequence_num", { ascending: false });
  
  // Deduplicate to get the latest balance per supplier
  const supplierMap = new Map();
  latestBalances?.forEach(tx => {
    if (!supplierMap.has(tx.supplier_id)) {
      supplierMap.set(tx.supplier_id, tx.new_balance);
    }
  });
  const totalSupplierBalance = Array.from(supplierMap.values()).reduce((sum, bal) => sum + Number(bal), 0);

  return (
    <main className="flex-1 p-4 md:p-8 overflow-auto bg-slate-50 min-h-[calc(100vh-130px)]">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">Live Operational View</p>
        </div>
      </div>

      {/* NEEDS YOUR ATTENTION */}
      <div className="mb-8 space-y-3">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500" /> NEEDS YOUR ATTENTION
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/admin/orders?filter=unviewed" className="bg-red-50 hover:bg-red-100 border border-red-100 rounded-xl p-4 transition-colors group">
            <div className="text-3xl font-bold text-red-600 mb-1">{unviewedOrders}</div>
            <div className="text-xs font-semibold text-red-800 flex justify-between items-center">
              New / Unviewed <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </Link>
          <Link href="/admin/orders?filter=paid" className="bg-orange-50 hover:bg-orange-100 border border-orange-100 rounded-xl p-4 transition-colors group">
            <div className="text-3xl font-bold text-orange-600 mb-1">{paidUnprocessed}</div>
            <div className="text-xs font-semibold text-orange-800 flex justify-between items-center">
              Paid (Unprocessed) <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </Link>
          <Link href="/admin/orders?filter=ready" className="bg-amber-50 hover:bg-amber-100 border border-amber-100 rounded-xl p-4 transition-colors group">
            <div className="text-3xl font-bold text-amber-600 mb-1">{readyForSupplier}</div>
            <div className="text-xs font-semibold text-amber-800 flex justify-between items-center">
              Ready for Supplier <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </Link>
          <Link href="/admin/issues" className="bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-xl p-4 transition-colors group">
            <div className="text-3xl font-bold text-blue-600 mb-1">{issuesCount || 0}</div>
            <div className="text-xs font-semibold text-blue-800 flex justify-between items-center">
              Customer Issues <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <WalletCards className="w-5 h-5" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-500 mb-1">Total Revenue</p>
            <h3 className="text-2xl font-bold text-slate-900">₦{totalRevenue.toLocaleString()}</h3>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-500 mb-1">Estimated Profit</p>
            <h3 className="text-2xl font-bold text-slate-900">₦{totalProfit.toLocaleString()}</h3>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                <Truck className="w-5 h-5" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-500 mb-1">Supplier Balance</p>
            <h3 className="text-2xl font-bold text-slate-900">₦{totalSupplierBalance.toLocaleString()}</h3>
          </CardContent>
        </Card>

        <Card className={`border-none shadow-sm ${supplierPaymentPending > 0 ? "ring-2 ring-red-500/20" : ""}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${supplierPaymentPending > 0 ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-400"}`}>
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-500 mb-1">Pending Supplier Payments</p>
            <h3 className={`text-2xl font-bold ${supplierPaymentPending > 0 ? "text-slate-900" : "text-slate-400"}`}>
              {supplierPaymentPending} Orders
            </h3>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Orders Table */}
        <Card className="border-none shadow-sm lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
            <CardTitle>Recent Orders</CardTitle>
            <Link href="/admin/orders" className="text-sm text-blue-600 hover:underline">View All</Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-medium border-b">
                  <tr>
                    <th className="px-6 py-4">Order ID</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentOrders && recentOrders.length > 0 ? (
                    recentOrders.map((order: any) => (
                      <tr key={order.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-medium text-slate-900">
                          <Link href={`/admin/orders/${order.id}`} className="hover:underline">
                            #{order.id.split("-")[0].toUpperCase()}
                          </Link>
                        </td>
                        <td className="px-6 py-4">{new Date(order.created_at).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                            {order.order_status || "NEW"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-bold">₦{Number(order.total_amount).toLocaleString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                        No orders have been placed yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Catalog Overview */}
        <Card className="border-none shadow-sm">
          <CardHeader className="border-b pb-4">
            <CardTitle>Catalog Overview</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-blue-50 flex items-center justify-center text-blue-600"><Package className="w-5 h-5"/></div>
                <div>
                  <p className="font-bold text-slate-900">{productCount || 0}</p>
                  <p className="text-xs text-slate-500">Live Products</p>
                </div>
              </div>
              <Link href="/admin/products"><Button variant="outline" size="sm">Manage</Button></Link>
            </div>
            
            <div className="pt-4 border-t">
               <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-emerald-50 flex items-center justify-center text-emerald-600"><Users className="w-5 h-5"/></div>
                  <div>
                    <p className="font-bold text-slate-900">{userCount || 0}</p>
                    <p className="text-xs text-slate-500">Registered Customers</p>
                  </div>
                </div>
                <Link href="/admin/customers"><Button variant="outline" size="sm">View</Button></Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
