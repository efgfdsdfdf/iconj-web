import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Package, User, Clock, ChevronLeft, Truck, CreditCard, ArrowRight } from "lucide-react";
import Link from "next/link";
import { SendToSupplierButton } from "./SendToSupplierButton";
import { OrderReadMarker } from "./OrderReadMarker";
import { OrderTimeline } from "./components/OrderTimeline";
import { AdminNotes } from "./components/AdminNotes";
import { requireAdmin } from "@/lib/auth/admin";

export default async function AdminOrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const resolvedParams = await params;
  
  const { data: order } = await supabaseAdmin.from("orders").select("*, supplier:suppliers(email)").eq("id", resolvedParams.id).single();
  if (!order) return notFound();

  const { data: items } = await supabaseAdmin.from("order_items").select(`
    *,
    product:products(name, sku, images)
  `).eq("order_id", order.id);

  const { data: timelineEvents } = await supabaseAdmin.from("order_events").select("*").eq("order_id", order.id).order("created_at", { ascending: true });
  const { data: adminNotes } = await supabaseAdmin.from("admin_notes").select("*").eq("order_id", order.id).order("created_at", { ascending: true });

  const address = order.delivery_address || {};

  return (
    <main className="flex-1 p-4 md:p-8 bg-slate-50 min-h-screen">
      <OrderReadMarker orderId={order.id} adminViewed={!!order.admin_viewed} />
      
      <div className="mb-6">
        <Link href="/admin/orders" className="text-sm text-slate-500 hover:text-blue-600 flex items-center mb-4 w-fit">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Orders
        </Link>
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Order #{order.id.split("-")[0].toUpperCase()}</h1>
            <p className="text-sm text-slate-500">Placed on {new Date(order.created_at).toLocaleString()}</p>
          </div>
          <SendToSupplierButton order={order} items={items || []} />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* FULFILLMENT STATUS SPLIT */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="border-none shadow-sm bg-blue-50/50">
              <CardContent className="p-4">
                <p className="text-xs font-bold text-blue-800 mb-1 uppercase tracking-wider">Customer Status</p>
                <div className="text-lg font-bold text-slate-900">{order.order_status}</div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-indigo-50/50">
              <CardContent className="p-4">
                <p className="text-xs font-bold text-indigo-800 mb-1 uppercase tracking-wider">Supplier Status</p>
                <div className="text-lg font-bold text-slate-900">{order.supplier_order_status}</div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-none shadow-sm">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-lg">Order Items</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                {items?.map((item: any) => (
                  <div key={item.id} className="flex gap-4 items-center">
                    <div className="w-16 h-16 bg-slate-100 rounded overflow-hidden">
                      {item.product?.images?.[0] ? (
                        <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400"><Package className="w-6 h-6"/></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-900">{item.product?.name || "Unknown Product"}</h4>
                      <div className="text-xs text-slate-500 mt-1 space-x-2">
                        {item.configuration?.width && <span>Size: {item.configuration.width}x{item.configuration.height}cm</span>}
                        {item.configuration?.motorType && <span>Motor: {item.configuration.motorType}</span>}
                        {item.configuration?.fabric && <span>Fabric: {item.configuration.fabric}</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">₦{Number(item.unit_price).toLocaleString()}</p>
                      <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <OrderTimeline events={timelineEvents || []} />
          
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-lg flex items-center"><User className="w-4 h-4 mr-2" /> Customer & Shipping</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3 text-sm text-slate-700">
                <div>
                  <p className="font-bold text-slate-900">{address.name || "N/A"}</p>
                  <p>{address.phone || "No phone"}</p>
                </div>
                <div className="pt-3 border-t">
                  <p>{address.street || "No street"}</p>
                  <p>{address.city || "No city"}</p>
                  <p>{address.state || "No state"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-lg flex items-center"><CreditCard className="w-4 h-4 mr-2" /> Financial Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Payment Status</span>
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${order.payment_status === "PAID" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"}`}>
                  {order.payment_status}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Customer Paid</span>
                <span className="font-bold text-slate-900">₦{Number(order.total_amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                <span className="text-slate-500">Supplier Cost</span>
                <span className="font-bold text-rose-600">-₦{Number(order.supplier_cost).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Shipping Cost</span>
                <span className="font-bold text-rose-600">-₦{Number(order.shipping_cost).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                <span className="font-bold text-slate-900">Estimated Profit</span>
                <span className="font-bold text-emerald-600">₦{Number(order.estimated_profit).toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          <AdminNotes orderId={order.id} notes={adminNotes || []} />

        </div>
      </div>
    </main>
  );
}
