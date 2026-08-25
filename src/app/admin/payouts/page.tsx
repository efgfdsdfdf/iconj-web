import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/auth/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, AlertCircle } from "lucide-react";
import Link from "next/link";

export const revalidate = 0;

export default async function AdminPayoutsPage() {
  await requireAdmin();
  const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  // Fetch ALL ledger entries to calculate true pending settlement per seller
  const { data: ledgerEntries } = await supabaseAdmin
    .from("financial_ledger")
    .select("*, sellers(businesses(business_name), stores(store_name))");

  const payoutsBySeller: Record<string, { seller: any, pendingSettlement: number, totalGross: number }> = {};
  
  if (ledgerEntries) {
    for (const entry of ledgerEntries) {
      if (!payoutsBySeller[entry.seller_id]) {
        payoutsBySeller[entry.seller_id] = { 
          seller: entry.sellers, 
          pendingSettlement: 0,
          totalGross: 0
        };
      }
      
      const amt = Number(entry.amount);
      if (entry.transaction_type === 'SETTLEMENT_PENDING') {
        payoutsBySeller[entry.seller_id].pendingSettlement += amt;
      }
      if (entry.transaction_type === 'SETTLEMENT_SUCCESSFUL') {
        payoutsBySeller[entry.seller_id].pendingSettlement -= amt;
      }
      if (entry.transaction_type === 'SALE_GROSS') {
        payoutsBySeller[entry.seller_id].totalGross += amt;
      }
    }
  }

  // Filter only sellers that actually have a positive pending balance > 0
  const pendingSellers = Object.entries(payoutsBySeller).filter(([_, data]) => data.pendingSettlement > 0);
  
  // Calculate Grand Total
  const grandTotalOwed = pendingSellers.reduce((sum, [_, data]) => sum + data.pendingSettlement, 0);

  return (
    <main className="flex-1 p-4 md:p-8 overflow-auto bg-slate-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Seller Settlements</h1>
        <p className="text-sm text-slate-500">Immutable ledger balances that are awaiting Paystack settlement or manual payout.</p>
      </div>
      
      {/* Grand Total Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border-none shadow-sm bg-gradient-to-br from-slate-900 to-slate-800 text-white">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-slate-400 mb-1">Total Pending Settlement</p>
            <p className="text-3xl font-black tracking-tight">₦{grandTotalOwed.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8 flex gap-3 text-amber-800 text-sm">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <div>
          <p className="font-bold mb-1">Important: Paystack Subaccounts</p>
          <p>If the ICONJ Paystack account is fully upgraded to a Registered Business with Subaccounts active, payouts will happen automatically and the ledger will update via Webhook. If you are on a Starter Business account, you must manually transfer these funds to the sellers and mark them as paid.</p>
        </div>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="border-b bg-white">
          <CardTitle className="flex items-center gap-2 text-slate-800 text-lg">
            <Wallet className="w-5 h-5 text-emerald-600" /> Outstanding Balances
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                <tr>
                  <th className="px-6 py-4">Business / Store</th>
                  <th className="px-6 py-4">Lifetime Gross Sales</th>
                  <th className="px-6 py-4">Pending Settlement</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {pendingSellers.map(([sellerId, data]) => (
                  <tr key={sellerId} className="hover:bg-slate-50 bg-white">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{data.seller?.businesses?.business_name || 'Unknown Business'}</p>
                      <p className="text-xs text-slate-500">{data.seller?.stores?.[0]?.store_name || 'No Store Name'}</p>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-600">
                      ₦{data.totalGross.toLocaleString(undefined, {minimumFractionDigits: 2})}
                    </td>
                    <td className="px-6 py-4 font-black text-emerald-700 text-lg">
                      ₦{data.pendingSettlement.toLocaleString(undefined, {minimumFractionDigits: 2})}
                    </td>
                    <td className="px-6 py-4">
                      {/* Form to mark as paid manually if needed (future implementation) */}
                      <Button variant="outline" className="text-xs font-bold uppercase tracking-wider" asChild>
                        <Link href={`/admin/sellers`}>View Seller</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
                {pendingSellers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500 font-medium">
                      No pending payouts! The financial ledger shows all sellers are fully settled.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
