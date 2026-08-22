import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { createClient } from "@supabase/supabase-js";
import { Truck, Plus, ArrowRight } from "lucide-react";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
import { AddSupplierDialog } from "./AddSupplierDialog";

export const revalidate = 0;

export default async function AdminSupplierListPage() {
  await requireAdmin();
  const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  // Fetch all suppliers
  const { data: suppliers } = await supabaseAdmin.from("suppliers").select("*").order("name");

  // Fetch latest balances for all suppliers
  const { data: latestBalances } = await supabaseAdmin
    .from("supplier_transactions")
    .select("supplier_id, new_balance")
    .order("sequence_num", { ascending: false });

  // Fetch pending supplier payments (orders that are SENT or PAYMENT_PENDING)
  const { data: pendingOrders } = await supabaseAdmin
    .from("orders")
    .select("supplier_id, supplier_cost")
    .eq("supplier_order_status", "PAYMENT_PENDING");

  const supplierMap = new Map();
  latestBalances?.forEach(tx => {
    if (!supplierMap.has(tx.supplier_id)) {
      supplierMap.set(tx.supplier_id, tx.new_balance);
    }
  });

  const pendingMap = new Map();
  pendingOrders?.forEach(order => {
    if (!pendingMap.has(order.supplier_id)) pendingMap.set(order.supplier_id, 0);
    pendingMap.set(order.supplier_id, pendingMap.get(order.supplier_id) + Number(order.supplier_cost));
  });

  return (
    <main className="flex-1 p-4 md:p-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Supplier Management</h1>
          <p className="text-sm text-slate-500">Manage multiple suppliers, ledgers, and payments.</p>
        </div>
        <AddSupplierDialog />
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="pl-6">Supplier Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Available Balance</TableHead>
                <TableHead>Pending Payments</TableHead>
                <TableHead className="text-right pr-6">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers && suppliers.length > 0 ? (
                suppliers.map((supplier) => {
                  const balance = supplierMap.get(supplier.id) || 0;
                  const pending = pendingMap.get(supplier.id) || 0;
                  return (
                    <TableRow key={supplier.id} className="hover:bg-slate-50">
                      <TableCell className="pl-6 font-bold text-slate-900 flex items-center gap-2">
                        <Truck className="w-4 h-4 text-slate-400" /> {supplier.name}
                      </TableCell>
                      <TableCell className="text-slate-500 text-xs">
                        {supplier.email}<br/>{supplier.phone}
                      </TableCell>
                      <TableCell>
                        <span className={`font-bold ${balance > 0 ? 'text-emerald-600' : balance < 0 ? 'text-red-600' : 'text-slate-600'}`}>
                          {supplier.currency} {Number(balance).toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        {pending > 0 ? (
                          <span className="font-bold text-red-600">{supplier.currency} {Number(pending).toLocaleString()}</span>
                        ) : (
                          <span className="text-slate-400">None</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <Link href={`/admin/supplier/${supplier.id}`}>
                          <Button size="sm" variant="outline" className="hover:bg-blue-50 hover:text-blue-600">
                            View Ledger <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-slate-500">
                    No suppliers added yet.
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
