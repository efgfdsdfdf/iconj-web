import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Package, User, Clock, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function AdminOrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const resolvedParams = await params;
  
  const { data: order } = await supabase.from("orders").select("*").eq("id", resolvedParams.id).single();
  if (!order) return notFound();

  const { data: items } = await supabase.from("order_items").select(`
    *,
    product:products(name, sku, images)
  `).eq("order_id", order.id);

  const address = order.delivery_address || {};

  return (
    <main className="flex-1 p-8 bg-slate-50 min-h-screen">
      <div className="mb-6">
        <Link href="/admin/orders" className="text-sm text-slate-500 hover:text-blue-600 flex items-center mb-4">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Orders
        </Link>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Order #{order.id.split("-")[0].toUpperCase()}</h1>
            <p className="text-sm text-slate-500">Placed on {new Date(order.created_at).toLocaleString()}</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700"><Package className="w-4 h-4 mr-2" /> Send to Supplier</Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Order Details */}
        <div className="lg:col-span-2 space-y-6">
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
                      <p className="font-bold text-slate-900">?{Number(item.unit_price).toLocaleString()}</p>
                      <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-lg flex items-center"><MapPin className="w-4 h-4 mr-2" /> Shipping Address</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-1 text-sm text-slate-700">
                <p className="font-bold text-slate-900 mb-2">Customer Details</p>
                <p>{address.street || "No street provided"}</p>
                <p>{address.city || "No city provided"}</p>
                <p>{address.state || "No state provided"}</p>
                {/* Fallback to checkout API saved name/phone if available inside address json */}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-lg flex items-center"><Clock className="w-4 h-4 mr-2" /> Status</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Payment</span>
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${order.payment_status === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{order.payment_status}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Fulfillment</span>
                <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase bg-blue-100 text-blue-700">{order.order_status}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

