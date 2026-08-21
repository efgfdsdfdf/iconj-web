import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { Eye } from "lucide-react";
import Link from "next/link";

export const revalidate = 0;

export default async function AdminOrdersPage() {
  const supabase = await createClient();
  const { data: orders } = await supabase.from("orders").select("*").order("created_at", { ascending: false });

  return (
    <main className="flex-1 p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
          <p className="text-sm text-slate-500">Manage customer orders and supplier fulfillment.</p>
        </div>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Order ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right pr-6">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders && orders.length > 0 ? (
                orders.map((order: any) => (
                  <TableRow key={order.id}>
                    <TableCell className="pl-6 font-medium text-slate-900">
                      #{order.id.split("-")[0].toUpperCase()}
                    </TableCell>
                    <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="font-bold">₦{Number(order.total_amount).toLocaleString()}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${order.payment_status === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                        {order.payment_status || "pending"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700">
                        {order.order_status || "processing"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Link href={`/admin/orders/${order.id}`}>
                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800">
                          <Eye className="w-4 h-4 mr-2" /> View Details
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    No orders yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
