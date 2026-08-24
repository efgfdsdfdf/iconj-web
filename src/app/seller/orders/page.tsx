import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SellerOrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: seller } = await supabase
    .from("sellers")
    .select("id")
    .eq("profile_id", user?.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const { data: orders } = await supabase
    .from("seller_orders")
    .select("*, orders(delivery_address, payment_status, created_at), order_items(*)")
    .eq("seller_id", seller?.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                <tr>
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Items</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {orders?.map((order: any) => (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium">{order.id.split('-')[0]}</td>
                    <td className="px-6 py-4 text-slate-500">{new Date(order.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      {order.orders?.delivery_address?.name}<br/>
                      <span className="text-xs text-slate-500">{order.orders?.delivery_address?.city}, {order.orders?.delivery_address?.state}</span>
                    </td>
                    <td className="px-6 py-4">{order.order_items?.length || 0} items</td>
                    <td className="px-6 py-4 font-bold">₦{order.total_amount.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs font-bold">{order.status}</span>
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-blue-600 hover:underline text-xs font-bold">Manage</button>
                    </td>
                  </tr>
                ))}
                {(!orders || orders.length === 0) && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">No orders found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
