import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Truck, CheckCircle2, Clock, User, MapPin, AlertCircle, MessageCircle } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LogoutButton } from "../LogoutButton";
import { Suspense } from "react";
import { CartClearer } from "./CartClearer";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export const revalidate = 0;

export default async function CustomerOrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const supabaseAdmin = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const { data: orders } = await supabaseAdmin
    .from("orders")
    .select("*, order_items(*, products(name))")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const getStatusConfig = (status: string) => {
    switch(status) {
      case 'NEW': return { color: "text-amber-600 bg-amber-50", icon: Clock, label: "Pending Payment" };
      case 'PAYMENT_CONFIRMED': return { color: "text-blue-600 bg-blue-50", icon: Package, label: "Payment Confirmed" };
      case 'PROCESSING': return { color: "text-blue-600 bg-blue-50", icon: Package, label: "Processing" };
      case 'SHIPPED': return { color: "text-purple-600 bg-purple-50", icon: Truck, label: "Shipped" };
      case 'DELIVERED': return { color: "text-emerald-600 bg-emerald-50", icon: CheckCircle2, label: "Delivered" };
      default: return { color: "text-slate-600 bg-slate-50", icon: Package, label: status };
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-12">
      <Suspense fallback={null}>
        <CartClearer />
      </Suspense>
      <div className="bg-white border-b shadow-sm mb-8">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-slate-900">My Orders</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar Navigation */}
          <div className="w-full lg:w-64 shrink-0">
            <Card className="border-none shadow-sm overflow-hidden">
              <nav className="flex flex-col">
                <Link href="/account" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 border-l-4 border-transparent text-slate-700 font-medium">
                  <User className="w-5 h-5 text-slate-500" /> Account Overview
                </Link>
                <Link href="/account/orders" className="flex items-center gap-3 px-4 py-3 bg-slate-100 border-l-4 border-blue-500 font-bold text-slate-900 border-t">
                  <Package className="w-5 h-5 text-blue-500" /> My Orders
                </Link>
                <Link href="/account/addresses" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 border-l-4 border-transparent text-slate-700 font-medium border-t">
                  <MapPin className="w-5 h-5 text-slate-400" /> Saved Addresses
                </Link>
                <Link href="/account/issues" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 border-l-4 border-transparent text-slate-700 font-medium border-t">
                  <AlertCircle className="w-5 h-5 text-slate-400" /> Returns & Issues
                </Link>
                <Link href="/account/support" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 border-l-4 border-transparent text-slate-700 font-medium border-t">
                  <MessageCircle className="w-5 h-5 text-slate-400" /> Contact Support
                </Link>
                <div className="p-4 border-t bg-slate-50">
                  <LogoutButton />
                </div>
              </nav>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-slate-500">View and track all your recent purchases</p>
              </div>
              <Link href="/shop">
                <Button variant="outline">Continue Shopping</Button>
              </Link>
            </div>

      <div className="space-y-4">
        {orders && orders.length > 0 ? (
          orders.map((order) => {
            const statusConfig = getStatusConfig(order.order_status);
            const StatusIcon = statusConfig.icon;
            
            return (
              <Card key={order.id} className="hover:border-blue-200 transition-colors">
                <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6 text-slate-500" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">Order #{order.id.split('-')[0].toUpperCase()}</p>
                      <p className="text-sm text-slate-500">Placed on {new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:flex md:items-center gap-6 md:gap-12 w-full md:w-auto text-sm">
                    <div>
                      <p className="text-slate-500 mb-1">Items</p>
                      <p className="font-medium text-slate-900">{order.order_items?.length || 0} items</p>
                    </div>
                    <div>
                      <p className="text-slate-500 mb-1">Total</p>
                      <p className="font-bold text-emerald-600">?{Number(order.total_amount).toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between w-full md:w-auto gap-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${statusConfig.color}`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      {statusConfig.label}
                    </span>
                    <Link href={`/track?id=${order.id}`}>
                      <Button className="bg-slate-900 hover:bg-slate-800">Track</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="text-center py-16 bg-white rounded-lg border shadow-sm">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">No orders found</h3>
            <p className="text-slate-500 mb-6">You haven't made any purchases yet.</p>
            <Link href="/shop">
              <Button className="bg-rose-500 hover:bg-rose-600">Start Shopping</Button>
            </Link>
          </div>
        )}
      </div>
          </div>
        </div>
      </div>
    </div>
  );
}
