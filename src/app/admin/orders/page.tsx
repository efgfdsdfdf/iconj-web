import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { createClient } from "@supabase/supabase-js";
import { Eye, Search, Filter } from "lucide-react";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";

export const revalidate = 0;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const adminUserId = await requireAdmin();
  const resolvedParams = await searchParams;
  const filter = typeof resolvedParams.filter === 'string' ? resolvedParams.filter : 'all';

  const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  let query = supabaseAdmin.from("orders").select("*");

  // Apply quick filters
  if (filter === 'unviewed') query = query.eq('admin_viewed', false);
  else if (filter === 'paid') query = query.eq('payment_status', 'PAID').eq('order_status', 'PAYMENT_CONFIRMED');
  else if (filter === 'processing') query = query.eq('order_status', 'PROCESSING');
  else if (filter === 'shipped') query = query.eq('order_status', 'SHIPPED');

  // We fetch all matching orders so we can sort them in memory for the Priority Queue
  const { data: rawOrders } = await query;

  let orders = rawOrders || [];

  // PRIORITY QUEUE SORTING
  orders.sort((a, b) => {
    // 1. Unviewed / New
    if (!a.admin_viewed && b.admin_viewed) return -1;
    if (a.admin_viewed && !b.admin_viewed) return 1;
    
    // 2. Ready for Supplier
    if (a.order_status === 'READY_FOR_SUPPLIER' && b.order_status !== 'READY_FOR_SUPPLIER') return -1;
    if (b.order_status === 'READY_FOR_SUPPLIER' && a.order_status !== 'READY_FOR_SUPPLIER') return 1;

    // 3. Paid but unconfirmed
    if (a.payment_status === 'PAID' && a.order_status === 'PAYMENT_CONFIRMED' && b.order_status !== 'PAYMENT_CONFIRMED') return -1;
    if (b.payment_status === 'PAID' && b.order_status === 'PAYMENT_CONFIRMED' && a.order_status !== 'PAYMENT_CONFIRMED') return 1;

    // 4. Supplier Payment Pending
    if (a.supplier_order_status === 'PAYMENT_PENDING' && b.supplier_order_status !== 'PAYMENT_PENDING') return -1;
    if (b.supplier_order_status === 'PAYMENT_PENDING' && a.supplier_order_status !== 'PAYMENT_PENDING') return 1;

    // Default: Chronological descending
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const getFilterClass = (currentFilter: string) => 
    filter === currentFilter 
      ? "bg-slate-900 text-white hover:bg-slate-800" 
      : "bg-white text-slate-600 hover:bg-slate-100 border-slate-200";

  return (
    <main className="flex-1 p-4 md:p-8 bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Priority Orders Queue</h1>
          <p className="text-sm text-slate-500">Sorted automatically by what needs attention most.</p>
        </div>
      </div>

      {/* QUICK FILTERS */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Link href="/admin/orders?filter=all"><Button variant="outline" size="sm" className={getFilterClass('all')}>All</Button></Link>
        <Link href="/admin/orders?filter=unviewed"><Button variant="outline" size="sm" className={getFilterClass('unviewed')}>Unviewed</Button></Link>
        <Link href="/admin/orders?filter=paid"><Button variant="outline" size="sm" className={getFilterClass('paid')}>Paid (Unprocessed)</Button></Link>
        <Link href="/admin/orders?filter=processing"><Button variant="outline" size="sm" className={getFilterClass('processing')}>Processing</Button></Link>
        <Link href="/admin/orders?filter=shipped"><Button variant="outline" size="sm" className={getFilterClass('shipped')}>Shipped</Button></Link>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="pl-6 whitespace-nowrap">Order ID</TableHead>
                  <TableHead className="whitespace-nowrap">Date</TableHead>
                  <TableHead className="whitespace-nowrap">Total</TableHead>
                  <TableHead className="whitespace-nowrap">Payment</TableHead>
                  <TableHead className="whitespace-nowrap">Fulfillment</TableHead>
                  <TableHead className="text-right pr-6 whitespace-nowrap">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length > 0 ? (
                  orders.map((order: any) => (
                    <TableRow key={order.id} className={!order.admin_viewed ? "bg-blue-50/80 hover:bg-blue-100/80" : "hover:bg-slate-50"}>
                      <TableCell className={`pl-6 ${!order.admin_viewed ? "font-bold text-blue-900" : "font-medium text-slate-900"}`}>
                        <div className="flex items-center gap-2">
                          #{order.id.split("-")[0].toUpperCase()}
                          {!order.admin_viewed && (
                            <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0">NEW</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className={!order.admin_viewed ? "font-semibold" : ""}>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className={`font-bold ${!order.admin_viewed ? "text-slate-900" : "text-slate-700"}`}>₦{Number(order.total_amount).toLocaleString()}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${order.payment_status === "PAID" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"}`}>
                          {order.payment_status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          order.order_status === 'DELIVERED' ? "bg-green-100 text-green-700" :
                          order.order_status === 'SHIPPED' ? "bg-purple-100 text-purple-700" :
                          order.order_status === 'PROCESSING' ? "bg-blue-100 text-blue-700" :
                          "bg-slate-100 text-slate-700"
                        }`}>
                          {order.order_status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <Link href={`/admin/orders/${order.id}`}>
                          <Button size="sm" variant={!order.admin_viewed ? "default" : "outline"} className={!order.admin_viewed ? "bg-blue-600 hover:bg-blue-700" : ""}>
                            <Eye className="w-4 h-4 mr-2" /> View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                      No orders found matching the filter.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
