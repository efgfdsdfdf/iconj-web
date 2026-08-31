import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, MapPin, User, Ruler, Settings, Wrench } from "lucide-react";
import { SellerOrderStatusDropdown } from "./SellerOrderStatusDropdown";

export const revalidate = 0;

export default async function SellerOrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const { data: seller } = await supabaseAdmin
    .from("sellers")
    .select("id")
    .eq("profile_id", user?.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!seller) {
    return (
      <div className="p-8 text-center text-slate-500">
        <p>You are not registered as a seller.</p>
      </div>
    );
  }

  const { data: orders } = await supabaseAdmin
    .from("seller_orders")
    .select("*, orders(id, delivery_address, payment_status, created_at, user_id, profiles:user_id(name, email, phone))")
    .eq("seller_id", seller.id)
    .order("created_at", { ascending: false });

  // Fetch order items for each seller order
  const sellerOrderIds = orders?.map(o => o.id) || [];
  let orderItemsMap: Record<string, any[]> = {};
  
  if (sellerOrderIds.length > 0) {
    const { data: allItems } = await supabaseAdmin
      .from("order_items")
      .select("*, products(name, images)")
      .in("seller_order_id", sellerOrderIds);
    
    if (allItems) {
      for (const item of allItems) {
        if (!orderItemsMap[item.seller_order_id]) orderItemsMap[item.seller_order_id] = [];
        orderItemsMap[item.seller_order_id].push(item);
      }
    }
  }

  const statusColors: Record<string, string> = {
    PENDING_PAYMENT: "bg-yellow-100 text-yellow-800",
    PROCESSING: "bg-blue-100 text-blue-800",
    SHIPPED: "bg-purple-100 text-purple-800",
    DELIVERED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
        <p className="text-sm text-slate-500 mt-1">View customer orders with full details including dimensions and specifications.</p>
      </div>
      
      {(!orders || orders.length === 0) && (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">No orders yet</h3>
            <p className="text-slate-500">When customers purchase your products, orders will appear here.</p>
          </CardContent>
        </Card>
      )}

      {orders?.map((order: any) => {
        const items = orderItemsMap[order.id] || [];
        const addr = order.orders?.delivery_address || {};
        const payStatus = order.orders?.payment_status;
        
        const customerName =
          (addr.name && addr.name.trim().length > 0 ? addr.name.trim() : null) ||
          order.orders?.profiles?.name ||
          (addr.email && addr.email.trim().length > 0 ? addr.email.trim() : null) ||
          order.orders?.profiles?.email ||
          "Customer";
        const customerEmail = (addr.email && addr.email.trim().length > 0 ? addr.email.trim() : null) || order.orders?.profiles?.email;
        const customerPhone = (addr.phone && addr.phone.trim().length > 0 ? addr.phone.trim() : null) || order.orders?.profiles?.phone;
        
        return (
          <Card key={order.id} className="border-none shadow-sm overflow-hidden">
            {/* Order Header */}
            <div className="bg-slate-900 text-white p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <span className="text-xs text-slate-400">Order ID</span>
                <h3 className="font-bold text-lg tracking-wide">{order.id.split('-')[0].toUpperCase()}</h3>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <Badge className={statusColors[order.status] || "bg-slate-100 text-slate-700"}>{order.status}</Badge>
                {payStatus && (
                  <Badge className={payStatus === "PAID" ? "bg-emerald-100 text-emerald-800" : "bg-yellow-100 text-yellow-800"}>
                    Payment: {payStatus}
                  </Badge>
                )}
                <span className="text-sm text-slate-300">
                  {new Date(order.created_at).toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
                
                {/* STATUS UPDATER */}
                {payStatus === "PAID" && (
                  <div className="ml-0 md:ml-4 border-l border-slate-700 pl-0 md:pl-4">
                    <SellerOrderStatusDropdown orderId={order.id} currentStatus={order.status} />
                  </div>
                )}
              </div>
            </div>

            <CardContent className="p-0">
              <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x">
                
                {/* Customer & Delivery Info */}
                <div className="p-5 space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" /> Customer
                    </h4>
                    <p className="font-semibold text-slate-900">{customerName}</p>
                    {customerEmail && <p className="text-sm text-slate-500">{customerEmail}</p>}
                    {customerPhone && <p className="text-sm text-slate-500">{customerPhone}</p>}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" /> Delivery Address
                    </h4>
                    <p className="text-sm text-slate-700">{addr.street || "N/A"}</p>
                    <p className="text-sm text-slate-700">{addr.city}{addr.state ? `, ${addr.state}` : ""}</p>
                  </div>
                  <div className="pt-2 border-t">
                    <span className="text-xs text-slate-500">Order Total</span>
                    <p className="text-xl font-black text-slate-900">₦{order.total_amount?.toLocaleString()}</p>
                  </div>
                </div>

                {/* Order Items with Full Details */}
                <div className="md:col-span-2 p-5">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5" /> Items Ordered ({items.length})
                  </h4>
                  <div className="space-y-4">
                    {items.map((item: any) => {
                      const config = item.configuration_details || {};
                      const productImage = item.products?.images?.[0];
                      
                      return (
                        <div key={item.id} className="flex gap-4 p-3 bg-slate-50 rounded-lg border">
                          {/* Product Image */}
                          <div className="w-16 h-16 bg-white rounded overflow-hidden border shrink-0">
                            {productImage ? (
                              <img src={productImage} alt={config.product_name || item.products?.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <Package className="w-6 h-6" />
                              </div>
                            )}
                          </div>

                          {/* Product Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-2">
                              <h5 className="font-bold text-slate-900 text-sm truncate">{config.product_name || item.products?.name}</h5>
                              <span className="font-bold text-slate-900 text-sm shrink-0">₦{(item.unit_price * item.quantity).toLocaleString()}</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Qty: {item.quantity} × ₦{item.unit_price?.toLocaleString()} | SKU: {config.sku || "N/A"}
                            </p>
                            
                            {/* Customer Specifications */}
                            {(config.width || config.height || config.motorType || config.requiresInstall || config.selected_variant || config.custom_notes || config.color) && (
                              <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded space-y-1">
                                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1">
                                  <Settings className="w-3 h-3" /> Customer Specifications
                                </span>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                                  {config.color && (
                                      <div className="flex items-center gap-1">
                                        <Settings className="w-3 h-3 text-amber-600" />
                                        <span className="text-slate-600">Color:</span>
                                        <span className="font-bold text-slate-900">{config.color}</span>
                                      </div>
                                    )}
                                    {config.width && config.width !== "0cm" && (
                                    <div className="flex items-center gap-1">
                                      <Ruler className="w-3 h-3 text-amber-600" />
                                      <span className="text-slate-600">Width:</span>
                                      <span className="font-bold text-slate-900">{config.width}</span>
                                    </div>
                                  )}
                                  {config.height && config.height !== "0cm" && (
                                    <div className="flex items-center gap-1">
                                      <Ruler className="w-3 h-3 text-amber-600" />
                                      <span className="text-slate-600">Height:</span>
                                      <span className="font-bold text-slate-900">{config.height}</span>
                                    </div>
                                  )}
                                  {config.motorType && (
                                    <div className="flex items-center gap-1">
                                      <Settings className="w-3 h-3 text-amber-600" />
                                      <span className="text-slate-600">Motor:</span>
                                      <span className="font-bold text-slate-900">{config.motorType}</span>
                                    </div>
                                  )}
                                  {config.requiresInstall !== undefined && (
                                    <div className="flex items-center gap-1">
                                      <Wrench className="w-3 h-3 text-amber-600" />
                                      <span className="text-slate-600">Installation:</span>
                                      <span className="font-bold text-slate-900">{config.requiresInstall ? "Yes" : "No"}</span>
                                    </div>
                                  )}
                                  {config.selected_variant && (
                                    <div className="flex items-center gap-1 col-span-2">
                                      <Settings className="w-3 h-3 text-amber-600" />
                                      <span className="text-slate-600">Variant:</span>
                                      <span className="font-bold text-slate-900">{typeof config.selected_variant === 'object' ? JSON.stringify(config.selected_variant) : config.selected_variant}</span>
                                    </div>
                                  )}
                                  {config.custom_notes && (
                                    <div className="flex gap-1 col-span-2 mt-1 pt-1 border-t border-amber-200/50">
                                      <span className="text-slate-600">Notes:</span>
                                      <span className="font-bold text-slate-900">{config.custom_notes}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
