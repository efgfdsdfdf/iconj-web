import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { ChevronLeft, Truck, ArrowDownRight, ArrowUpRight, Plus, RefreshCw } from "lucide-react";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
import { RecordPaymentDialog } from "./RecordPaymentDialog";
import { AddFundsDialog } from "./AddFundsDialog";
import { DeleteSupplierButton } from "./DeleteSupplierButton";
import { AdjustmentDialog } from "./AdjustmentDialog";

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

  // Fetch orders assigned to supplier that are pending payment
  const { data: pendingOrders } = await supabaseAdmin
    .from("orders")
    .select("id, created_at, supplier_cost, supplier_order_status")
    .eq("supplier_id", supplier.id)
    .in("supplier_order_status", ["SENT", "PAYMENT_PENDING"]);

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
              {supplier.name} Ledger
              <DeleteSupplierButton supplierId={supplier.id} supplierName={supplier.name} />
            </h1>
            <p className="text-sm text-slate-500">Immutable Financial Transaction Ledger</p>
          </div>
          <div className="flex gap-2">
            <AdjustmentDialog supplier={supplier} />
            <AddFundsDialog supplier={supplier} />
            <RecordPaymentDialog supplier={supplier} currentBalance={currentBalance} pendingOrders={pendingOrders || []} />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-none shadow-sm bg-slate-900 text-white">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-slate-400 mb-1">Available Balance</p>
            <h3 className={`text-3xl font-bold ${currentBalance < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {supplier.currency} {currentBalance.toLocaleString()}
            </h3>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-slate-500 mb-1">Total Funds Added</p>
            <h3 className="text-2xl font-bold text-slate-900">{supplier.currency} {totalFundsAdded.toLocaleString()}</h3>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-slate-500 mb-1">Total Paid (Debits)</p>
            <h3 className="text-2xl font-bold text-rose-600">{supplier.currency} {totalPayments.toLocaleString()}</h3>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm ring-1 ring-amber-500/20 bg-amber-50/30">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-amber-700 mb-1">Pending Supplier Cost</p>
            <h3 className="text-2xl font-bold text-amber-700">{supplier.currency} {totalPendingCost.toLocaleString()}</h3>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Ledger Table */}
        <div className="lg:col-span-2">
          <Card className="border-none shadow-sm">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-lg">Immutable Transaction Ledger</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="pl-6">Seq #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right pr-6">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {txs.length > 0 ? (
                      txs.map((tx: any) => (
                        <TableRow key={tx.id} className="hover:bg-slate-50">
                          <TableCell className="pl-6 text-xs text-slate-400 font-mono">{tx.sequence_num}</TableCell>
                          <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                            {new Date(tx.created_at).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                              {tx.transaction_type.replace(/_/g, ' ')}
                            </span>
                          </TableCell>
                          <TableCell>
                            {tx.order_id ? (
                              <Link href={`/admin/orders/${tx.order_id}`} className="text-blue-600 hover:underline text-sm font-bold">
                                #{tx.order_id.split("-")[0].toUpperCase()}
                              </Link>
                            ) : (
                              <span className="text-sm text-slate-500">{tx.description || tx.reference || "Manual"}</span>
                            )}
                          </TableCell>
                          <TableCell className={`text-right font-bold ${tx.credit_debit === 'CREDIT' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            <div className="flex items-center justify-end gap-1">
                              {tx.credit_debit === 'CREDIT' ? <ArrowUpRight className="w-3 h-3"/> : <ArrowDownRight className="w-3 h-3"/>}
                              {supplier.currency} {Number(tx.amount).toLocaleString()}
                            </div>
                          </TableCell>
                          <TableCell className="text-right pr-6 font-bold text-slate-900">
                            {supplier.currency} {Number(tx.new_balance).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                          No transactions recorded. Ledger is empty.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Orders Sidebar */}
        <div className="space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-lg">Orders Awaiting Payment</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {pendingOrders && pendingOrders.length > 0 ? (
                <div className="space-y-4">
                  {pendingOrders.map((o: any) => (
                    <div key={o.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div>
                        <Link href={`/admin/orders/${o.id}`} className="text-sm font-bold text-blue-600 hover:underline block">
                          #{o.id.split("-")[0].toUpperCase()}
                        </Link>
                        <span className="text-[10px] uppercase font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded mt-1 inline-block">
                          {o.supplier_order_status}
                        </span>
                      </div>
                      <div className="text-right font-bold text-slate-900 text-sm">
                        {supplier.currency} {Number(o.supplier_cost).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">No pending orders.</p>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </main>
  );
}
