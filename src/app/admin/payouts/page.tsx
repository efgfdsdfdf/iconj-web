import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/auth/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";

export const revalidate = 0;

export default async function AdminPayoutsPage() {
  await requireAdmin();
  const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  // Aggregate pending commissions by seller
  const { data: commissions } = await supabaseAdmin
    .from("commissions")
    .select("*, sellers(businesses(business_name), stores(store_name))")
    .eq("status", "PENDING");

  const payoutsBySeller: Record<string, { seller: any, total: number, orders: number }> = {};
  
  commissions?.forEach((c: any) => {
    if (!payoutsBySeller[c.seller_id]) {
      payoutsBySeller[c.seller_id] = { seller: c.sellers, total: 0, orders: 0 };
    }
    payoutsBySeller[c.seller_id].total += Number(c.seller_net_amount);
    payoutsBySeller[c.seller_id].orders += 1;
  });

  return (
    <main className="flex-1 p-4 md:p-8 overflow-auto bg-slate-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Pending Payouts</h1>
        <p className="text-sm text-slate-500">Remit balances to sellers for completed orders.</p>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="border-b bg-white">
          <CardTitle className="flex items-center gap-2 text-slate-800">
            <Wallet className="w-5 h-5 text-emerald-600" /> Ready for Processing
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                <tr>
                  <th className="px-6 py-4">Business / Store</th>
                  <th className="px-6 py-4">Pending Orders</th>
                  <th className="px-6 py-4">Total Amount Owed</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {Object.entries(payoutsBySeller).map(([sellerId, data]) => (
                  <tr key={sellerId} className="hover:bg-slate-50 bg-white">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{data.seller?.businesses?.business_name}</p>
                      <p className="text-xs text-slate-500">{data.seller?.stores?.[0]?.store_name}</p>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-600">
                      {data.orders} orders
                    </td>
                    <td className="px-6 py-4 font-black text-emerald-700 text-lg">
                      ₦{data.total.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <Button className="bg-emerald-600 hover:bg-emerald-700 text-xs font-bold uppercase tracking-wider">
                        Mark Paid
                      </Button>
                    </td>
                  </tr>
                ))}
                {Object.keys(payoutsBySeller).length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500 font-medium">
                      No pending payouts. All sellers are paid up.
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
