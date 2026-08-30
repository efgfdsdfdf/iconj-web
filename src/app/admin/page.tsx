import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Users, Wallet, ArrowRight, ShieldAlert, BadgeCheck } from "lucide-react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/auth/admin";

export const revalidate = 0;

export default async function AdminDashboardPage() {
  await requireAdmin();
  const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  // 1. Pending Seller Approvals
  const { count: pendingSellers } = await supabaseAdmin
    .from("sellers")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending_verification");

  // 2. Disputed/Issue Orders
  const { count: disputedOrders } = await supabaseAdmin
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("order_status", "DISPUTED");
    
  // 3. Pending Payouts (Withdrawal Requests)
  const { data: pendingRequests } = await supabaseAdmin
    .from("withdrawal_requests")
    .select("amount")
    .eq("status", "PENDING");
  const totalPendingPayouts = pendingRequests?.reduce((sum, r) => sum + Number(r.amount), 0) || 0;
  const pendingPayoutCount = pendingRequests?.length || 0;

  // 4. Unread Support Messages
  const { data: supportMsgs } = await supabaseAdmin
    .from("support_messages")
    .select("user_id, is_from_admin, created_at");
  let unreadSupportUsers = 0;
  if (supportMsgs) {
    const userConversations: Record<string, { lastCustomerMsg: number; lastAdminMsg: number }> = {};
    supportMsgs.forEach((msg) => {
      const time = new Date(msg.created_at).getTime();
      if (!userConversations[msg.user_id]) userConversations[msg.user_id] = { lastCustomerMsg: 0, lastAdminMsg: 0 };
      if (msg.is_from_admin) {
        userConversations[msg.user_id].lastAdminMsg = Math.max(userConversations[msg.user_id].lastAdminMsg, time);
      } else {
        userConversations[msg.user_id].lastCustomerMsg = Math.max(userConversations[msg.user_id].lastCustomerMsg, time);
      }
    });
    unreadSupportUsers = Object.values(userConversations).filter(c => c.lastCustomerMsg > c.lastAdminMsg).length;
  }

  // 5. Unviewed Orders (Only count PAID orders, ignore abandoned checkouts)
  const { count: unviewedOrders } = await supabaseAdmin
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("admin_viewed", false)
    .eq("payment_status", "PAID");

  // 6. Platform Financials (Total Paid Orders)
  const { data: paidOrders } = await supabaseAdmin
    .from("orders")
    .select("total_amount")
    .eq("payment_status", "PAID");
  const totalRevenue = paidOrders?.reduce((sum, o) => sum + Number(o.total_amount), 0) || 0;

  // Calculate Net Profit
  // Profit = Total Revenue - Total Supplier Cost - Total Seller Commissions (Only from PAID orders)
  const { data: paidCommissions } = await supabaseAdmin
    .from("commissions")
    .select("seller_net_amount")
    .neq("status", "PENDING");
  const totalCommissions = paidCommissions?.reduce((sum, c) => sum + Number(c.seller_net_amount), 0) || 0;

  const { data: rawPaidItems } = await supabaseAdmin
    .from("order_items")
    .select("quantity, unit_price, orders!inner(payment_status), products!inner(base_supplier_cost, base_selling_price)")
    .eq("orders.payment_status", "PAID");

  let totalSupplierCost = 0;
  rawPaidItems?.forEach((item: any) => {
    let cp = item.products?.base_supplier_cost || 0;
    const sp = item.products?.base_selling_price || 0;
    if (sp > 0 && cp > 0) {
      cp = item.unit_price * (cp / sp);
    }
    totalSupplierCost += (cp * item.quantity);
  });

  // Net Profit is simply the Revenue minus what we pay the sellers (which is the platform commission!)
  const netProfit = totalRevenue - totalCommissions;
  
  // Total Sellers
  const { count: totalSellers } = await supabaseAdmin
    .from("sellers")
    .select("*", { count: "exact", head: true })
    .eq("status", "approved");

  return (
    <main className="flex-1 p-4 md:p-8 overflow-auto bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Platform Dashboard</h1>
          <p className="text-sm text-slate-500">Overview of everything happening across ICONJ.</p>
        </div>
      </div>

      {/* NEEDS YOUR ATTENTION */}
      <div className="mb-8 space-y-3">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wider">
          <AlertCircle className="w-4 h-4 text-red-500" /> Action Required
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          
          <Link href="/admin/orders?filter=unviewed" className="bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl p-5 transition-colors group relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-3xl font-black text-blue-600 mb-1">{unviewedOrders || 0}</div>
                <h3 className="font-bold text-blue-900">New Orders</h3>
                <p className="text-xs text-blue-700 mt-1">Orders you haven't checked.</p>
              </div>
            </div>
          </Link>

          <Link href="/admin/support" className="bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl p-5 transition-colors group relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-3xl font-black text-purple-600 mb-1">{unreadSupportUsers}</div>
                <h3 className="font-bold text-purple-900">Unread Support</h3>
                <p className="text-xs text-purple-700 mt-1">Customers waiting for reply.</p>
              </div>
            </div>
          </Link>

          <Link href="/admin/sellers" className="bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl p-5 transition-colors group relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-3xl font-black text-amber-600 mb-1">{pendingSellers || 0}</div>
                <h3 className="font-bold text-amber-900">Pending Sellers</h3>
                <p className="text-xs text-amber-700 mt-1">Awaiting approval.</p>
              </div>
            </div>
          </Link>

          <Link href="/admin/issues" className="bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl p-5 transition-colors group relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-3xl font-black text-red-600 mb-1">{disputedOrders || 0}</div>
                <h3 className="font-bold text-red-900">Disputed Orders</h3>
                <p className="text-xs text-red-700 mt-1">Customer complaints.</p>
              </div>
            </div>
          </Link>

        </div>
      </div>

      {/* KPI Cards */}
      <div className="mt-8 mb-8">
        <h2 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">Platform Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white">
                  <BadgeCheck className="w-5 h-5" />
                </div>
              </div>
              <p className="text-sm font-medium text-emerald-50 mb-1">Net Platform Profit</p>
              <h3 className="text-2xl font-bold text-white">₦{netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
              <p className="text-xs text-emerald-100 mt-1">Total revenue minus all costs</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <Wallet className="w-5 h-5" />
                </div>
              </div>
              <p className="text-sm font-medium text-slate-500 mb-1">Total Revenue (Gross)</p>
              <h3 className="text-2xl font-bold text-slate-900">₦{totalRevenue.toLocaleString()}</h3>
            </CardContent>
          </Card>
          
          <Card className="border-none shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                  <Wallet className="w-5 h-5" />
                </div>
              </div>
              <p className="text-sm font-medium text-slate-500 mb-1">Pending Seller Payouts</p>
              <h3 className="text-2xl font-bold text-slate-900">₦{totalPendingPayouts.toLocaleString()}</h3>
              <p className="text-xs text-slate-500 mt-1">{pendingPayoutCount} payouts waiting</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <p className="text-sm font-medium text-slate-500 mb-1">Active Sellers</p>
              <h3 className="text-2xl font-bold text-slate-900">{totalSellers || 0} Sellers</h3>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
