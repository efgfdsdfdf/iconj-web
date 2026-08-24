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
    .eq("status", "pending_review");

  // 2. Disputed/Issue Orders
  const { count: disputedOrders } = await supabaseAdmin
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("order_status", "DISPUTED");
    
  // 3. Pending Payouts (Commissions)
  const { data: pendingCommissions } = await supabaseAdmin
    .from("commissions")
    .select("seller_net_amount")
    .eq("status", "PENDING");
    
  const totalPendingPayouts = pendingCommissions?.reduce((sum, c) => sum + Number(c.seller_net_amount), 0) || 0;
  const pendingPayoutCount = pendingCommissions?.length || 0;

  return (
    <main className="flex-1 p-4 md:p-8 overflow-auto bg-slate-50 min-h-[calc(100vh-130px)]">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Action Center</h1>
          <p className="text-sm text-slate-500">Management by Exception: Focus only on what needs your attention.</p>
        </div>
      </div>

      {/* NEEDS YOUR ATTENTION */}
      <div className="mb-8 space-y-3">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500" /> REQUIRES IMMEDIATE ACTION
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <Link href="/admin/sellers" className="bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl p-6 transition-colors group relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-4xl font-black text-amber-600 mb-2">{pendingSellers || 0}</div>
                <h3 className="font-bold text-amber-900">Pending Seller Approvals</h3>
                <p className="text-sm text-amber-700 mt-1">Review business applications before they can sell.</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
                <BadgeCheck className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm font-bold text-amber-700">
              Review Applications <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link href="/admin/issues" className="bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl p-6 transition-colors group relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-4xl font-black text-red-600 mb-2">{disputedOrders || 0}</div>
                <h3 className="font-bold text-red-900">Disputed Orders</h3>
                <p className="text-sm text-red-700 mt-1">Customer complaints or failed deliveries.</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                <ShieldAlert className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm font-bold text-red-700">
              Resolve Disputes <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link href="/admin/payouts" className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl p-6 transition-colors group relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-4xl font-black text-emerald-600 mb-2">{pendingPayoutCount}</div>
                <h3 className="font-bold text-emerald-900">Pending Payouts</h3>
                <p className="text-sm text-emerald-700 mt-1">Totaling ₦{totalPendingPayouts.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                <Wallet className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm font-bold text-emerald-700">
              Process Payouts <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mt-12">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-500 text-sm">Everything is running smoothly. The multi-vendor engine is active. Sub-orders are generating correctly, and payments are being verified server-side via Paystack.</p>
          </CardContent>
        </Card>
      </div>

    </main>
  );
}
