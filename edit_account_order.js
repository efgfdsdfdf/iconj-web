const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'src/app/account/orders/[id]/page.tsx');

const content = `import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Truck, Package, Clock, MapPin, AlertCircle, RefreshCcw } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CustomerResolutionClient } from "./CustomerResolutionClient";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export const revalidate = 0;

export default async function OrderTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const supabaseAdmin = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("*, order_items(*, products(name, images))")
    .eq("id", id)
    .single();

  if (!order || order.user_id !== user.id) {
    redirect("/account/orders");
  }

  const { data: issues } = await supabaseAdmin
    .from("logistics_issues")
    .select("*")
    .eq("order_id", order.id)
    .eq("issue_type", "SUPPLIER_CANNOT_FULFILL")
    .order("created_at", { ascending: false });

  const activeIssue = issues?.find(i => i.status === "OPEN");

  const address = order.delivery_address || {};

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      PENDING: "Pending Payment",
      PAYMENT_CONFIRMED: "Paid / Order Received",
      PROCESSING: "Paid / Order Received",
      SENT_TO_SUPPLIER: "Sent to Supplier",
      SUPPLIER_CONFIRMED: "Supplier Confirmed",
      IN_FULFILLMENT: "In Fulfillment",
      READY_FOR_SHIPPING: "Ready for Shipping",
      SHIPPED: "Shipped",
      DELIVERED: "Delivered",
      SUPPLIER_CANNOT_FULFILL: "Action Required"
    };
    return map[status] || status;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Track Your Order</h1>
          <p className="text-slate-500">Order #{id.split("-")[0].toUpperCase()} - Placed on {new Date(order.created_at).toLocaleDateString()}</p>
        </div>
        <span className={\`font-bold px-4 py-1.5 rounded-full text-sm \${order.logistics_status === 'SUPPLIER_CANNOT_FULFILL' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}\`}>
          {getStatusLabel(order.logistics_status || order.order_status)}
        </span>
      </div>

      {activeIssue && (
        <Card className="border-red-200 shadow-sm mb-8 bg-red-50">
          <CardHeader className="border-b border-red-100 pb-4">
            <CardTitle className="text-lg text-red-800 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" /> Action Required: Update Your Customization
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-red-900 mb-6">
              We're sorry, but one of the specifications in your customized order is currently unavailable from our supplier. Please review the available alternative or contact us so we can help resolve the order.
            </p>
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg border border-red-100">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Unavailable Spec</span>
                <span className="font-medium text-slate-900">{activeIssue.expected_data?.unavailable_spec}</span>
              </div>
              <div className="bg-white p-4 rounded-lg border border-red-100">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Alternative Offered</span>
                <span className="font-medium text-emerald-600">{activeIssue.expected_data?.alternative_offered}</span>
              </div>
              <div className="bg-white p-4 rounded-lg border border-red-100">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Price Difference</span>
                <span className="font-medium text-slate-900">
                  {Number(activeIssue.expected_data?.price_difference) < 0 
                    ? \`-\` + Math.abs(Number(activeIssue.expected_data?.price_difference)).toLocaleString()
                    : \`+\` + Number(activeIssue.expected_data?.price_difference).toLocaleString()}
                </span>
              </div>
            </div>
            
            <CustomerResolutionClient issueId={activeIssue.id} priceDifference={activeIssue.expected_data?.price_difference} />
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Order Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-lg">Order Items</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {order.order_items?.map((item: any) => (
                <div key={item.id} className="flex gap-4">
                  <div className="w-20 h-20 bg-slate-100 rounded-md overflow-hidden shrink-0">
                    <img src={item.products?.images?.[0] || "/images/placeholder.jpg"} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{item.products?.name}</h4>
                    <p className="text-sm text-slate-500 mb-2">Qty: {item.quantity} × ?{item.price.toLocaleString()}</p>
                    
                    {item.configuration_details && (
                      <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-md grid grid-cols-2 gap-2 mt-2">
                        {item.configuration_details.width && <div><span className="font-semibold">Width:</span> {item.configuration_details.width}</div>}
                        {item.configuration_details.height && <div><span className="font-semibold">Height:</span> {item.configuration_details.height}</div>}
                        {item.configuration_details.color && <div><span className="font-semibold">Color:</span> {item.configuration_details.color}</div>}
                        {item.configuration_details.motorType && <div><span className="font-semibold">Motor:</span> {item.configuration_details.motorType}</div>}
                        {item.configuration_details.custom_notes && <div className="col-span-2"><span className="font-semibold">Notes:</span> {item.configuration_details.custom_notes}</div>}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-lg flex items-center gap-2"><MapPin className="w-4 h-4" /> Delivery Address</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="font-bold text-slate-900">{address.firstName} {address.lastName}</p>
              <p className="text-slate-600 text-sm mt-1">{address.address}</p>
              <p className="text-slate-600 text-sm">{address.city}, {address.state}</p>
              <p className="text-slate-600 text-sm mt-2">{address.phone}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-lg">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-3 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>?{order.total_amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 pt-3 border-t">
                <span>Total Paid</span>
                <span>?{order.total_amount.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
`;
fs.writeFileSync(file, content);
console.log('Done rewriting account order details page');
