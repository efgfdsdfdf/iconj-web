import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { MessageCircle, FileText, Factory, ArrowRight } from "lucide-react";
import Link from "next/link";
import CopyOrderButton from "./CopyOrderButton";

export const revalidate = 0;

export default async function AdminSupplierPage() {
  const supabase = await createClient();

  // Fetch orders that have been paid but are still in processing/production
  const { data: orders } = await supabase
    .from("orders")
    .select("*, order_items(*, products(*)), profiles(name, email)")
    .eq("payment_status", "paid")
    .in("order_status", ["in_production", "processing"])
    .order("created_at", { ascending: true });

  const totalOwed = orders?.reduce((sum, o) => sum + (Number(o.supplier_cost) || 0), 0) || 0;
  const totalOrders = orders?.length || 0;

  return (
    <main className="flex-1 p-4 md:p-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Supplier Fulfilment CRM</h1>
          <p className="text-sm text-slate-500">Manage dropshipping orders and forward them to your manufacturers.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="border-none shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <Factory className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Orders to Fulfill</p>
              <h3 className="text-2xl font-bold text-slate-900">{totalOrders}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm ring-1 ring-red-100">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Supplier Balance (Est.)</p>
              <h3 className="text-2xl font-bold text-red-600">?{totalOwed.toLocaleString()}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="bg-white border-b pb-4">
          <CardTitle className="text-lg">Pending Dropship Orders</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="pl-6">Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items / SKUs</TableHead>
                <TableHead>Supplier Cost</TableHead>
                <TableHead className="text-right pr-6">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders && orders.length > 0 ? (
                orders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-slate-50/50">
                    <TableCell className="pl-6 font-medium text-blue-600">
                      <Link href={\/admin/orders/\\}>
                        #{order.id.split('-')[0].toUpperCase()}
                      </Link>
                      <p className="text-xs text-slate-400 font-normal mt-1">{new Date(order.created_at).toLocaleDateString()}</p>
                    </TableCell>
                    <TableCell>
                      {order.profiles?.name || 'Guest'}
                      <p className="text-xs text-slate-500">
                        {order.delivery_address?.city}, {order.delivery_address?.state}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        {order.order_items?.map((item: any, i: number) => (
                          <div key={i} className="text-xs">
                            <span className="font-semibold">{item.quantity}x</span> {item.products?.name}
                            <div className="text-slate-500">SKU: {item.products?.supplier_sku || 'N/A'}</div>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-red-600">
                      ?{Number(order.supplier_cost).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <CopyOrderButton order={order} />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-16 text-slate-500">
                    <Factory className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    All paid orders have been forwarded to the supplier!
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
