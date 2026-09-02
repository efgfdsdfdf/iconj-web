import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Package, User, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { OrderReadMarker } from "./OrderReadMarker";
import { OrderTimeline } from "./components/OrderTimeline";
import { AdminNotes } from "./components/AdminNotes";
import { requireAdmin } from "@/lib/auth/admin";
import { EmailHistory } from "./components/EmailHistory";
import { SellerSubOrdersPanel } from "./components/SellerSubOrdersPanel";
import { getActiveForwarder, getLogisticsIssues } from "@/lib/logistics";
import { CopyToSupplierButton } from "./CopyToSupplierButton";
import { SupplierExceptionManager } from "./components/SupplierExceptionManager";
import { SupplierStatusPanel } from "./components/SupplierStatusPanel";

export const revalidate = 0;

export default async function AdminOrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const resolvedParams = await params;
  
  const { data: order } = await supabaseAdmin.from("orders").select("*").eq("id", resolvedParams.id).single();
  if (!order) return notFound();

  // Fetch sub-orders and their items
  const { data: sellerOrders } = await supabaseAdmin
    .from("seller_orders")
    .select("*, sellers(businesses(business_name)), order_items(*)")
    .eq("parent_order_id", order.id);

  const { data: items } = await supabaseAdmin.from("order_items").select(`
    *,
    product:products(name, sku, images, variants, supplier_sku)
  `).eq("order_id", order.id);

  const { data: timelineEvents } = await supabaseAdmin.from("order_events").select("*").eq("order_id", order.id).order("created_at", { ascending: true });
  const { data: adminNotes } = await supabaseAdmin.from("admin_notes").select("*").eq("order_id", order.id).order("created_at", { ascending: true });
  const { data: orderEmails } = await supabaseAdmin.from("order_emails").select("*").eq("order_id", order.id).order("created_at", { ascending: true });

  const activeForwarder = await getActiveForwarder();
  const issues = await getLogisticsIssues(order.id);

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
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          
          <SupplierStatusPanel order={order} />
            <SupplierExceptionManager orderId={order.id} currentIssues={issues} />

            {/* THE NEW COMMAND CENTER */}
          <SellerSubOrdersPanel subOrders={sellerOrders || []} />

          {/* Customer Info Card */}
          <Card className="border-none shadow-sm mt-8">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-lg">Customer Customization & Order Specs</CardTitle>
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
                      <h4 className="font-semibold text-slate-900 leading-tight">
                        {item.configuration_details?.product_name || item.product?.name}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">
                        SKU: {item.configuration_details?.store_sku || item.product?.sku}
                      </p>
                      {item.configuration_details?.color && (
                          <p className="text-sm text-slate-600 mt-1">
                            Color: {item.configuration_details.color}
                          </p>
                        )}
                        {item.configuration_details?.variant_string && (
                        <p className="text-sm text-slate-600 mt-1">
                          Variant: {item.configuration_details.variant_string}
                        </p>
                      )}
                      {item.configuration_details?.width && item.configuration_details?.width !== '0cm' && item.configuration_details?.width !== 'Standard' && (
                        <p className="text-sm text-slate-600">
                          Width: {item.configuration_details.width}
                        </p>
                      )}
                      {item.configuration_details?.height && item.configuration_details?.height !== '0cm' && item.configuration_details?.height !== 'Standard' && (
                        <p className="text-sm text-slate-600">
                          Height: {item.configuration_details.height}
                        </p>
                      )}
                      {item.configuration_details?.motorType && (
                        <p className="text-sm text-slate-600">
                          Motor: {item.configuration_details.motorType}
                        </p>
                      )}
                      {item.configuration_details?.selected_variant && (
                        <p className="text-sm text-slate-600">
                          Selected Variant: {typeof item.configuration_details.selected_variant === 'object' ? JSON.stringify(item.configuration_details.selected_variant) : item.configuration_details.selected_variant}
                        </p>
                      )}
                      {item.configuration_details?.supplier_sku && (
                        <p className="text-sm text-slate-600">
                          Supplier SKU: {item.configuration_details.supplier_sku}
                        </p>
                      )}
                      {item.configuration_details?.custom_notes && (
                        <p className="text-sm text-slate-600 mt-1 bg-amber-50 p-2 rounded border border-amber-100">
                          <span className="font-semibold text-amber-700">Notes:</span> {item.configuration_details.custom_notes}
                        </p>
                      )}
                    </div>
                      <div className="text-right flex flex-col items-end gap-2">
                        <div className="font-bold text-slate-900">₦{(item.unit_price * item.quantity).toLocaleString()}</div>
                        <div className="text-sm text-slate-500">Qty: {item.quantity} × ₦{item.unit_price.toLocaleString()}</div>
                        <CopyToSupplierButton item={item} address={address} />
                      </div>
                    </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* TIMELINE */}
          <OrderTimeline events={timelineEvents || []} />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-lg flex items-center"><User className="w-5 h-5 mr-2 text-slate-500" /> Customer Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4 text-sm">
              <div>
                <p className="text-slate-500 font-medium mb-1">Name</p>
                <p className="font-semibold text-slate-900">{(address.name || "").trim() || "N/A"}</p>
              </div>
              <div>
                <p className="text-slate-500 font-medium mb-1">Email</p>
                <a href={`mailto:${address.email}`} className="text-blue-600 hover:underline font-medium">{address.email || "N/A"}</a>
              </div>
              <div>
                <p className="text-slate-500 font-medium mb-1">Phone</p>
                <a href={`tel:${address.phone}`} className="text-blue-600 hover:underline font-medium">{address.phone || "N/A"}</a>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-lg flex items-center"><MapPin className="w-5 h-5 mr-2 text-slate-500" /> Nigeria Delivery Address</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-2 text-sm">
              <p className="text-slate-900">{address.street || "N/A"}</p>
              <p className="text-slate-900">{address.city}{address.state ? `, ${address.state}` : ""}</p>
              <p className="text-slate-900">Nigeria</p>
            </CardContent>
          </Card>
          
          <EmailHistory orderId={order.id} emails={orderEmails || []} />
          <AdminNotes orderId={order.id} notes={adminNotes || []} />
        </div>
      </div>
    </main>
  );
}
