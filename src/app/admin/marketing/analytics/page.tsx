import { requireAdmin } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowUpRight, MousePointerClick, Users, Eye, ShoppingCart, CreditCard } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Marketing Analytics | ICONJ Admin" };

export default async function AnalyticsDashboardPage() {
  await requireAdmin();
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  // Fetch High-Level Stats
  const { count: sessionCount } = await supabase.from('visitor_sessions').select('id', { count: 'exact', head: true });
  const { count: addCartCount } = await supabase.from('analytics_events').select('id', { count: 'exact', head: true }).eq('event_type', 'add_to_cart');
  const { count: checkoutCount } = await supabase.from('analytics_events').select('id', { count: 'exact', head: true }).eq('event_type', 'checkout_started');
  const { count: purchaseCount } = await supabase.from('analytics_events').select('id', { count: 'exact', head: true }).eq('event_type', 'purchase');

  // Attribution Snapshot Data (orders)
  const { data: attributionOrders } = await supabase
    .from('orders')
    .select('total_amount, attribution_snapshot')
    .not('attribution_snapshot', 'is', null);

  const sourceRevenue: Record<string, number> = {};
  if (attributionOrders) {
    for (const order of attributionOrders) {
      const source = order.attribution_snapshot?.first_touch_source || order.attribution_snapshot?.session_first_touch_source || 'direct';
      sourceRevenue[source] = (sourceRevenue[source] || 0) + Number(order.total_amount);
    }
  }

  const topSources = Object.entries(sourceRevenue)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const cr = sessionCount ? ((purchaseCount || 0) / sessionCount) * 100 : 0;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Marketing Analytics</h1>
          <p className="text-slate-500 mt-1">Acquisition and conversion funnel tracking</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/marketing"><Button variant="outline">Back to Marketing</Button></Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Sessions</CardTitle>
            <Users className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessionCount || 0}</div>
            <p className="text-xs text-slate-500 mt-1">Unique visitor sessions tracked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Added to Cart</CardTitle>
            <ShoppingCart className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{addCartCount || 0}</div>
            <p className="text-xs text-slate-500 mt-1">Products added to cart</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Checkouts Started</CardTitle>
            <CreditCard className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{checkoutCount || 0}</div>
            <p className="text-xs text-slate-500 mt-1">Initiated checkout flows</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Conversion Rate</CardTitle>
            <MousePointerClick className="w-4 h-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cr.toFixed(2)}%</div>
            <p className="text-xs text-slate-500 mt-1">Sessions that resulted in purchase</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Funnel */}
        <Card>
          <CardHeader>
            <CardTitle>Conversion Funnel</CardTitle>
            <CardDescription>Drop-off rates across the buying journey</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FunnelStep label="Total Sessions" count={sessionCount || 0} max={sessionCount || 0} color="bg-blue-100 border-blue-300 text-blue-900" />
            <FunnelStep label="Added to Cart" count={addCartCount || 0} max={sessionCount || 0} color="bg-emerald-100 border-emerald-300 text-emerald-900" />
            <FunnelStep label="Started Checkout" count={checkoutCount || 0} max={sessionCount || 0} color="bg-amber-100 border-amber-300 text-amber-900" />
            <FunnelStep label="Purchased" count={purchaseCount || 0} max={sessionCount || 0} color="bg-rose-100 border-rose-300 text-rose-900" />
          </CardContent>
        </Card>

        {/* Revenue by Source */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by First-Touch Source</CardTitle>
            <CardDescription>Attributed revenue based on first visitor interaction</CardDescription>
          </CardHeader>
          <CardContent>
            {topSources.length > 0 ? (
              <div className="space-y-4">
                {topSources.map(([source, revenue]) => (
                  <div key={source} className="flex items-center justify-between p-3 bg-slate-50 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-slate-200 flex items-center justify-center font-bold text-slate-500 uppercase text-xs">
                        {source.slice(0, 2)}
                      </div>
                      <span className="font-medium text-slate-900 capitalize">{source}</span>
                    </div>
                    <span className="font-bold text-emerald-600">₦{revenue.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-lg border border-dashed">
                No attribution data available yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}

function FunnelStep({ label, count, max, color }: { label: string, count: number, max: number, color: string }) {
  const percentage = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="relative h-12 w-full rounded-md border bg-slate-50 overflow-hidden flex items-center px-4">
      <div 
        className={`absolute top-0 left-0 h-full ${color} opacity-40 transition-all duration-1000`} 
        style={{ width: `${percentage}%` }}
      />
      <div className="relative z-10 flex justify-between w-full items-center">
        <span className="font-medium text-slate-800">{label}</span>
        <div className="flex items-center gap-4 text-sm font-medium">
          <span>{count}</span>
          <span className="text-slate-400 w-12 text-right">{percentage.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
}
