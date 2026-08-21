import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";
import Link from "next/link";

export default function CustomerOrdersPage() {
  const orders = [
    { id: "ICONJ-2024-000256", date: "May 12, 2024", status: "In Production", items: 2, total: "3,700,000", color: "text-amber-600 bg-amber-50" },
    { id: "ICONJ-2024-000192", date: "Apr 28, 2024", status: "Delivered", items: 1, total: "1,250,000", color: "text-emerald-600 bg-emerald-50" },
    { id: "ICONJ-2024-000145", date: "Apr 15, 2024", status: "Shipped", items: 3, total: "450,000", color: "text-blue-600 bg-blue-50" },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Orders</h1>
          <p className="text-slate-500">View and track all your recent orders</p>
        </div>
        <Link href="/shop">
          <Button variant="outline">Continue Shopping</Button>
        </Link>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <Card key={order.id} className="hover:border-blue-200 transition-colors">
            <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                  <Package className="w-8 h-8 text-slate-400" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">{order.id}</h3>
                  <p className="text-sm text-slate-500">Placed on {order.date} � {order.items} Items</p>
                </div>
              </div>

              <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-4">
                <div className="text-left md:text-right">
                  <p className="font-bold text-lg text-slate-900">₦{order.total}</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${order.color} mt-1`}>
                    {order.status}
                  </span>
                </div>
                <Link href={`/account/orders/${order.id}`}>
                  <Button className="bg-slate-900 hover:bg-slate-800">Track Order</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
