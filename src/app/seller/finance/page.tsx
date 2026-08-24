import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownRight, ArrowUpRight, DollarSign, Wallet } from "lucide-react";
import { redirect } from "next/navigation";

export default async function SellerFinancePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: seller } = await supabase
    .from("sellers")
    .select("id")
    .eq("profile_id", user?.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!seller) return redirect("/account");

  // Fetch Ledger
  const { data: ledgerEntries } = await supabase
    .from("financial_ledger")
    .select("*")
    .eq("seller_id", seller.id)
    .order("created_at", { ascending: false });

  // Calculate stats
  let totalGross = 0;
  let totalCommission = 0;
  let netEarnings = 0;
  let pendingSettlement = 0;
  let settledAmount = 0;

  ledgerEntries?.forEach((entry) => {
    const amt = Number(entry.amount);
    switch (entry.transaction_type) {
      case 'SALE_GROSS':
        totalGross += amt;
        break;
      case 'ICONJ_COMMISSION':
        totalCommission += Math.abs(amt);
        break;
      case 'SELLER_EARNING':
        netEarnings += amt;
        break;
      case 'SETTLEMENT_PENDING':
        pendingSettlement += amt;
        break;
      case 'SETTLEMENT_SUCCESSFUL':
        settledAmount += amt;
        pendingSettlement -= amt; // Reduce pending
        break;
    }
  });

  const formatCurrency = (val: number) => `₦${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Finance Ledger</h1>
        <p className="text-slate-500 mt-1">Immutable record of all your earnings, deductions, and payouts.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Gross Sales</CardTitle>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{formatCurrency(totalGross)}</div>
          </CardContent>
        </Card>
        
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Platform Commission</CardTitle>
            <ArrowDownRight className="w-4 h-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">-{formatCurrency(totalCommission)}</div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Pending Settlement</CardTitle>
            <Wallet className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{formatCurrency(pendingSettlement)}</div>
            <p className="text-xs text-amber-600/70 mt-1">Held by Paystack until transfer</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Settled to Bank</CardTitle>
            <ArrowUpRight className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(settledAmount)}</div>
            <p className="text-xs text-emerald-600/70 mt-1">Successfully transferred</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Description</th>
                  <th className="px-6 py-3">Reference</th>
                  <th className="px-6 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ledgerEntries && ledgerEntries.length > 0 ? (
                  ledgerEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                        {new Date(entry.created_at).toLocaleDateString()} <span className="text-xs text-slate-400">{new Date(entry.created_at).toLocaleTimeString()}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          entry.transaction_type === 'SETTLEMENT_SUCCESSFUL' ? 'bg-emerald-100 text-emerald-800' :
                          entry.transaction_type === 'ICONJ_COMMISSION' ? 'bg-red-100 text-red-800' :
                          entry.transaction_type.includes('PENDING') ? 'bg-amber-100 text-amber-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {entry.transaction_type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{entry.description}</td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-400">{entry.paystack_reference || '-'}</td>
                      <td className={`px-6 py-4 text-right font-medium ${Number(entry.amount) < 0 ? 'text-red-600' : 'text-slate-900'}`}>
                        {Number(entry.amount) > 0 ? '+' : ''}{formatCurrency(Number(entry.amount))}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      No financial transactions recorded yet.
                    </td>
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
