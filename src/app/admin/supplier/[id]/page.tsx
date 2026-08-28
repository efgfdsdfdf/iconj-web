import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { ChevronLeft, Truck, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
import { DeleteSupplierButton } from "./DeleteSupplierButton";

export const revalidate = 0;

export default async function SupplierLedgerPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const resolvedParams = await params;
  
  const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  // Fetch supplier
  const { data: supplier } = await supabaseAdmin.from("suppliers").select("*").eq("id", resolvedParams.id).single();
  if (!supplier) return notFound();

  // Fetch ledger transactions
  const { data: transactions } = await supabaseAdmin
    .from("supplier_transactions")
    .select(`
      *,
      orders(id, total_amount, supplier_cost, order_status)
    `)
    .eq("supplier_id", supplier.id)
    .order("sequence_num", { ascending: false });

  // Fetch paid order items for this supplier
  const { data: rawItems } = await supabaseAdmin
    .from("order_items")
    .select("order_id, quantity, unit_price, created_at, orders!inner(payment_status, id, created_at), products!inner(supplier_id, base_supplier_cost, base_selling_price)")
    .eq("products.supplier_id", supplier.id)
    .eq("orders.payment_status", "PAID");

  // Fetch already paid order IDs from ledger
  const { data: paidTxs } = await supabaseAdmin
    .from("supplier_transactions")
    .select("id, order_id, amount, created_at")
    .eq("transaction_type", "SUPPLIER_PAYMENT")
    .eq("supplier_id", supplier.id)
    .order("created_at", { ascending: false });
    
  const paidOrderIds = new Set(paidTxs?.filter(t => t.order_id).map(t => t.order_id) || []);

  // Group items into orders and calculate total supplier cost per order
  const pendingOrderMap = new Map();
  rawItems?.forEach((item: any) => {
    if (paidOrderIds.has(item.order_id)) return;

    let costPerItem = item.products.base_supplier_cost || 0;
    if (item.products.base_selling_price && item.products.base_selling_price > 0 && costPerItem > 0) {
       costPerItem = item.unit_price * (costPerItem / item.products.base_selling_price);
    }
    const totalCost = costPerItem * item.quantity;
    
    if (!pendingOrderMap.has(item.order_id)) {
      pendingOrderMap.set(item.order_id, {
        id: item.order_id,
        created_at: item.orders.created_at,
        supplier_cost: 0,
        supplier_order_status: "PAYMENT_PENDING"
      });
    }
    pendingOrderMap.get(item.order_id).supplier_cost += totalCost;
  });

  const pendingOrders = Array.from(pendingOrderMap.values()).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const txs = transactions || [];
  
  // Calculate Totals safely
  const currentBalance = txs.length > 0 ? Number(txs[0].new_balance) : 0;
  
  const totalFundsAdded = txs
    .filter(t => t.transaction_type === 'FUNDS_ADDED' || t.transaction_type === 'OPENING_BALANCE')
    .reduce((sum, t) => sum + Number(t.amount), 0);
    
  const totalPayments = txs
    .filter(t => t.transaction_type === 'SUPPLIER_PAYMENT')
    .reduce((sum, t) => sum + Number(t.amount), 0);
    
  const totalAdjustments = txs
    .filter(t => t.transaction_type === 'ADJUSTMENT' && t.credit_debit === 'CREDIT')
    .reduce((sum, t) => sum + Number(t.amount), 0)
    - txs
    .filter(t => t.transaction_type === 'ADJUSTMENT' && t.credit_debit === 'DEBIT')
    .reduce((sum, t) => sum + Number(t.amount), 0);
    
  const totalPendingCost = pendingOrders?.reduce((sum, o) => sum + Number(o.supplier_cost), 0) || 0;

  return (
    <main className="flex-1 p-4 md:p-8 bg-slate-50 min-h-screen">
      <div className="mb-6">
        <Link href="/admin/supplier" className="text-sm text-slate-500 hover:text-blue-600 flex items-center mb-4 w-fit">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Suppliers
        </Link>
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Truck className="w-6 h-6 text-slate-400" />
              {supplier.name} Orders
              <DeleteSupplierButton supplierId={supplier.id} supplierName={supplier.name} />
            </h1>
            <p className="text-sm text-slate-500">Track which orders you have paid the supplier for.</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        
        {/* Pending Orders */}
        <Card className="border-none shadow-sm">
          <CardHeader className="border-b pb-4 bg-amber-50 rounded-t-xl">
            <CardTitle className="text-lg text-amber-800">Orders Awaiting Payment</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {pendingOrders && pendingOrders.length > 0 ? (
              <div className="space-y-4">
                {pendingOrders.map((o: any) => (
                  <div key={o.id} className="flex justify-between items-center p-4 bg-white rounded-lg border shadow-sm">
                    <div>
                      <Link href={`/admin/orders/${o.id}`} className="text-sm font-bold text-blue-600 hover:underline block">
                        Order #{o.id.split("-")[0].toUpperCase()}
                      </Link>
                      <span className="text-xs text-slate-500 block mt-1">
                        Placed on {new Date(o.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right font-bold text-slate-900 text-lg">
                        {supplier.currency} {Number(o.supplier_cost).toLocaleString()}
                      </div>
                      <form action={async () => {
                        "use server";
                        const { createServerClient } = await import("@supabase/ssr");
                        const { cookies } = await import("next/headers");
                        const adminId = (await (await import("@/lib/auth/admin")).requireAdmin());
                        
                        const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { cookies: { get() { return undefined; } } });
                        
                        // Auto-fund and pay in one step
                        await supabase.from("supplier_transactions").insert({
                          supplier_id: supplier.id,
                          transaction_type: "FUNDS_ADDED",
                          credit_debit: "CREDIT",
                          amount: o.supplier_cost,
                          reference: "AUTO-FUND",
                          description: `Funding for order #${o.id.split("-")[0].toUpperCase()}`,
                          admin_id: adminId
                        });
                        
                        await supabase.from("supplier_transactions").insert({
                          supplier_id: supplier.id,
                          order_id: o.id,
                          transaction_type: "SUPPLIER_PAYMENT",
                          credit_debit: "DEBIT",
                          amount: o.supplier_cost,
                          reference: "PAID",
                          description: `Payment for order #${o.id.split("-")[0].toUpperCase()}`,
                          admin_id: adminId
                        });
                        
                        const { revalidatePath } = await import("next/cache");
                        revalidatePath(`/admin/supplier/${supplier.id}`);
                        revalidatePath(`/admin/supplier`);
                      }}>
                        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">Mark as Paid</Button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-400 mb-3" />
                <p>All orders have been paid!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Paid Orders */}
        <Card className="border-none shadow-sm">
          <CardHeader className="border-b pb-4 bg-slate-50 rounded-t-xl">
            <CardTitle className="text-lg text-slate-800">Recently Paid Orders</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Date Paid</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paidTxs && paidTxs.length > 0 ? (
                  paidTxs.slice(0, 20).map((tx: any) => (
                    <TableRow key={tx.id}>
                      <TableCell>
                        <Link href={`/admin/orders/${tx.order_id}`} className="text-sm font-bold text-blue-600 hover:underline">
                          #{tx.order_id?.split("-")[0].toUpperCase()}
                        </Link>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right font-bold text-slate-700">
                        {supplier.currency} {Number(tx.amount).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-slate-500">
                      No payments recorded yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
