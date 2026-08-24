import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/auth/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const revalidate = 0;

export default async function AdminSellersPage() {
  await requireAdmin();
  const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  const { data: sellers } = await supabaseAdmin
    .from("sellers")
    .select("*, businesses(*), stores(*)")
    .order("created_at", { ascending: false });

  const pending = sellers?.filter(s => s.status === 'pending_review') || [];
  const approved = sellers?.filter(s => s.status === 'approved') || [];

  return (
    <main className="flex-1 p-4 md:p-8 overflow-auto bg-slate-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Seller Management</h1>
        <p className="text-sm text-slate-500">Review and approve new marketplace vendors.</p>
      </div>

      <div className="space-y-8">
        <Card className="border-amber-200 shadow-sm">
          <CardHeader className="bg-amber-50 border-b border-amber-100">
            <CardTitle className="text-amber-900 flex items-center gap-2">
              Requires Approval ({pending.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {pending.length > 0 ? (
              <div className="divide-y">
                {pending.map((seller: any) => (
                  <div key={seller.id} className="p-6 flex flex-col lg:flex-row justify-between gap-4 hover:bg-slate-50">
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">{seller.businesses?.business_name}</h3>
                      <p className="text-sm text-slate-600 mb-2">Store: {seller.stores?.[0]?.store_name || "N/A"}</p>
                      <div className="grid sm:grid-cols-2 gap-x-8 gap-y-1 text-sm text-slate-500">
                        <p><strong>Type:</strong> {seller.businesses?.business_type}</p>
                        <p><strong>Tax ID:</strong> {seller.businesses?.tax_id || "N/A"}</p>
                        <p><strong>Phone:</strong> {seller.businesses?.phone}</p>
                        <p><strong>Email:</strong> {seller.businesses?.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-3 items-start shrink-0">
                      <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">Reject</Button>
                      <Button className="bg-emerald-600 hover:bg-emerald-700">Approve Seller</Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 font-medium">
                No sellers pending approval.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Active Sellers ({approved.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-y">
                  <tr>
                    <th className="px-6 py-4">Business Name</th>
                    <th className="px-6 py-4">Store</th>
                    <th className="px-6 py-4">Joined</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {approved.map((seller: any) => (
                    <tr key={seller.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-900">{seller.businesses?.business_name}</td>
                      <td className="px-6 py-4 text-slate-600">{seller.stores?.[0]?.store_name}</td>
                      <td className="px-6 py-4 text-slate-500">{new Date(seller.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wider">Active</span>
                      </td>
                      <td className="px-6 py-4">
                        <button className="text-blue-600 hover:underline font-medium text-xs">View Details</button>
                      </td>
                    </tr>
                  ))}
                  {approved.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No active sellers.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
