import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/auth/admin";
import { FileText, CheckCircle, XCircle } from "lucide-react";
import { revalidatePath } from "next/cache";

export const revalidate = 0;

export default async function AdminSellersPage() {
  await requireAdmin();
  
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch pending sellers with business info, store info, and KYC documents
  const { data: pendingSellers } = await supabaseAdmin
    .from("sellers")
    .select(`
      id, status, created_at,
      profiles ( email ),
      businesses ( business_name, business_type, address, phone, tax_id ),
      stores ( store_name, slug ),
      seller_verifications ( document_type, document_url )
    `)
    .eq("status", "pending_verification")
    .order("created_at", { ascending: false });

  async function approveSeller(formData: FormData) {
    "use server";
    const sellerId = formData.get("seller_id") as string;
    
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    await supabaseAdmin.from("sellers").update({ status: "approved" }).eq("id", sellerId);
    await supabaseAdmin.from("stores").update({ is_active: true }).eq("seller_id", sellerId);
    await supabaseAdmin.from("seller_verifications").update({ status: "approved" }).eq("seller_id", sellerId);
    
    revalidatePath("/admin/sellers");
    revalidatePath("/seller");
  }

  async function rejectSeller(formData: FormData) {
    "use server";
    const sellerId = formData.get("seller_id") as string;
    
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    await supabaseAdmin.from("sellers").update({ status: "rejected" }).eq("id", sellerId);
    await supabaseAdmin.from("seller_verifications").update({ status: "rejected" }).eq("seller_id", sellerId);
    
    revalidatePath("/admin/sellers");
    revalidatePath("/seller");
  }

  return (
    <main className="flex-1 p-4 md:p-8 overflow-auto bg-slate-50 min-h-[calc(100vh-130px)]">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Seller Approvals</h1>
        <p className="text-sm text-slate-500">Review KYC documents and approve new sellers to join the marketplace.</p>
      </div>

      <div className="space-y-6">
        {pendingSellers && pendingSellers.length > 0 ? (
          pendingSellers.map((seller: any) => (
            <Card key={seller.id} className="border-amber-200 shadow-sm overflow-hidden">
              <div className="bg-amber-50 px-6 py-3 border-b border-amber-200 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">PENDING VERIFICATION</Badge>
                  <span className="text-xs text-slate-500">Applied on {new Date(seller.created_at).toLocaleDateString()}</span>
                </div>
                <span className="text-sm font-medium text-slate-700">{seller.profiles?.email}</span>
              </div>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-3 gap-8">
                  {/* Business Details */}
                  <div className="space-y-4">
                    <h3 className="font-bold text-slate-900 border-b pb-2">Business Profile</h3>
                    <div>
                      <p className="text-xs text-slate-500">Legal Name</p>
                      <p className="font-medium">{seller.businesses?.business_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Store Name</p>
                      <p className="font-medium">{seller.stores?.[0]?.store_name} <span className="text-xs text-slate-400">({seller.stores?.[0]?.slug})</span></p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Business Type</p>
                      <p className="font-medium capitalize">{seller.businesses?.business_type}</p>
                    </div>
                  </div>

                  {/* Contact Details */}
                  <div className="space-y-4">
                    <h3 className="font-bold text-slate-900 border-b pb-2">Contact & Location</h3>
                    <div>
                      <p className="text-xs text-slate-500">Phone Number</p>
                      <p className="font-medium">{seller.businesses?.address?.phone || seller.businesses?.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Address</p>
                      <p className="font-medium">{seller.businesses?.address?.street}, {seller.businesses?.address?.city}, {seller.businesses?.address?.state}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Tax ID (TIN / BVN)</p>
                      <p className="font-medium">{seller.businesses?.tax_id || 'Not provided'}</p>
                    </div>
                  </div>

                  {/* KYC Documents & Actions */}
                  <div className="space-y-4 flex flex-col h-full">
                    <h3 className="font-bold text-slate-900 border-b pb-2">KYC Documents</h3>
                    <div className="space-y-2 flex-1">
                      {seller.seller_verifications?.map((doc: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 border rounded-md text-sm">
                          <FileText className="w-4 h-4 text-blue-600" />
                          <div className="flex-1 truncate">
                            <span className="font-semibold text-slate-700">{doc.document_type}:</span> {doc.document_url}
                          </div>
                        </div>
                      ))}
                      {(!seller.seller_verifications || seller.seller_verifications.length === 0) && (
                        <p className="text-sm text-slate-500 italic">No documents uploaded.</p>
                      )}
                    </div>
                    
                    <div className="flex gap-3 pt-4 border-t mt-auto">
                      <form action={rejectSeller} className="flex-1">
                        <input type="hidden" name="seller_id" value={seller.id} />
                        <Button type="submit" variant="outline" className="w-full border-red-200 text-red-600 hover:bg-red-50">
                          <XCircle className="w-4 h-4 mr-2" /> Reject
                        </Button>
                      </form>
                      <form action={approveSeller} className="flex-1">
                        <input type="hidden" name="seller_id" value={seller.id} />
                        <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
                          <CheckCircle className="w-4 h-4 mr-2" /> Approve
                        </Button>
                      </form>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="border-dashed border-2 shadow-none bg-slate-50">
            <CardContent className="flex flex-col items-center justify-center py-16 text-slate-500">
              <CheckCircle className="w-12 h-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-bold text-slate-700">All caught up!</h3>
              <p>There are no pending seller applications to review.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
