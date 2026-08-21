import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WalletCards, ShoppingBag, Users, Truck, TrendingUp, AlertTriangle, ArrowUpRight, Package, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

export const revalidate = 0;

export default async function AdminDashboardPage() {
  const supabase = await createServerClient();
  const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  // Fetch real metrics
  const { count: productCount } = await supabase.from("products").select("*", { count: "exact", head: true });
  const { count: userCount } = await supabaseAdmin.from("profiles").select("*", { count: "exact", head: true });
  const { data: orders } = await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(5);
  
  // Calculate real revenue from all orders
  const { data: allOrders } = await supabase.from("orders").select("total_amount, order_status, payment_status, supplier_cost");
  const paidOrders = allOrders?.filter(o => o.payment_status === 'paid') || [];
  const totalRevenue = paidOrders.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0);
  const activeOrdersCount = allOrders?.filter(o => o.order_status !== "delivered" && o.order_status !== "cancelled").length || 0;
  
  // Calculate Pending Supplier Payments
  const pendingSupplierPayments = paidOrders
    .filter(o => o.order_status === "in_production" || o.order_status === "processing")
    .reduce((sum, order) => sum + (Number(order.supplier_cost) || 0), 0);

  return (
    <main className="flex-1 p-4 md:p-8 overflow-auto bg-slate-50 min-h-[calc(100vh-130px)]">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">Welcome back, here is what is happening today.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline"><AlertTriangle className="w-4 h-4 mr-2" /> Issues</Button>
          <Button className="bg-blue-600 hover:bg-blue-700"><TrendingUp className="w-4 h-4 mr-2" /> Generate Report</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <WalletCards className="w-5 h-5" />
              </div>
              {totalRevenue > 0 && (
                <span className="text-xs font-bold text-emerald-600 flex items-center bg-emerald-50 px-2 py-1 rounded">
                  <TrendingUp className="w-3 h-3 mr-1" /> Active
                </span>
              )}
            </div>
            <p className="text-sm font-medium text-slate-500 mb-1">Total Revenue</p>
            <h3 className="text-2xl font-bold text-slate-900">₦{totalRevenue.toLocaleString()}</h3>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                <ShoppingBag className="w-5 h-5" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-500 mb-1">Active Orders</p>
            <h3 className="text-2xl font-bold text-slate-900">{activeOrdersCount}</h3>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-500 mb-1">Total Customers</p>
            <h3 className="text-2xl font-bold text-slate-900">{userCount || 0}</h3>
          </CardContent>
        </Card>

        <Card className={`border-none shadow-sm ${activeOrdersCount > 0 ? "ring-2 ring-red-500/20" : ""}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activeOrdersCount > 0 ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-400"}`}>
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-500 mb-1">Pending Supplier Payment</p>
            <h3 className={`text-2xl font-bold ${activeOrdersCount > 0 ? "text-slate-900" : "text-slate-400"}`}>
              {activeOrdersCount > 0 ? "₦" + pendingSupplierPayments.toLocaleString() : "₦0"}
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
                  {orders && orders.length > 0 ? (
                    orders.map((order: any) => (
                      <tr key={order.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-medium text-slate-900">#{order.id.split("-")[0].toUpperCase()}</td>
                        <td className="px-6 py-4">{new Date(order.created_at).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                            {order.status || "Pending"}
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

        {/* Inventory / Sales Breakdown */}
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

            <div className="pt-4 border-t space-y-4">
              <h4 className="text-sm font-bold text-slate-900">Sales by Category</h4>
              {totalRevenue > 0 ? (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-600">Newborn Starter Kit</span>
                      <span className="text-slate-900">65%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 w-[65%]"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-600">Premium Baby Monitor</span>
                      <span className="text-slate-900">25%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-500 w-[25%]"></div>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-xs text-slate-500 text-center py-4">Metrics will populate once first order is received.</p>
              )}
            </div>

          </CardContent>
        </Card>

      </div>
    </main>
  );
}



