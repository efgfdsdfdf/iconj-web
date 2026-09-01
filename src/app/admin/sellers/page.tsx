import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/auth/admin";
import { FileText, CheckCircle, XCircle, Store, DollarSign, Users, AlertTriangle } from "lucide-react";
import { revalidatePath } from "next/cache";
import { ClearAllSellersButton } from "@/components/admin/ClearAllSellersButton";
import { LiveSearch } from "@/components/admin/LiveSearch";
import Link from "next/link";

export const revalidate = 0;

export default async function AdminSellersPage({ searchParams }: { searchParams: Promise<{ tab?: string; search?: string }> }) {
  await requireAdmin();

  const params = await searchParams;
  const activeTab = params.tab || "pending";
  const search = params.search || "";
  
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Status mapping per tab
  const statusMap: Record<string, string> = {
    pending: "pending_verification",
    approved: "approved",
    rejected: "rejected",
    suspended: "suspended"
  };

  const status = statusMap[activeTab] || "pending_verification";

  // Fetch sellers with related data
  const { data: sellers } = await supabaseAdmin
    .from("sellers")
    .select(`
      id, status, created_at, profile_id, seller_identifier,
      profiles ( email ),
      businesses ( business_name, business_type, address, tax_id ),
      stores ( store_name, slug ),
      seller_verifications ( document_type, document_url ),
      seller_payout_accounts ( bank_name, account_number, verified_name, paystack_subaccount_code, status )
    `)
    .eq("status", status)
    .order("created_at", { ascending: false });

  // Filter sellers locally based on search query
  let filteredSellers = sellers || [];
  if (search) {
    const s = search.toLowerCase();
    filteredSellers = filteredSellers.filter((seller: any) => {
      const email = seller.profiles?.email?.toLowerCase() || "";
      const bizName = seller.businesses?.business_name?.toLowerCase() || "";
      const storeName = seller.stores?.[0]?.store_name?.toLowerCase() || "";
      const identifier = seller.seller_identifier?.toLowerCase() || "";
      return email.includes(s) || bizName.includes(s) || storeName.includes(s) || identifier.includes(s);
    });
  }

  // Fetch counts for all tabs
  const [pending, approved, rejected, suspended] = await Promise.all([
    supabaseAdmin.from("sellers").select("id", { count: "exact", head: true }).eq("status", "pending_verification"),
    supabaseAdmin.from("sellers").select("id", { count: "exact", head: true }).eq("status", "approved"),
    supabaseAdmin.from("sellers").select("id", { count: "exact", head: true }).eq("status", "rejected"),
    supabaseAdmin.from("sellers").select("id", { count: "exact", head: true }).eq("status", "suspended"),
  ]);

  const counts = {
    pending: pending.count || 0,
    approved: approved.count || 0,
    rejected: rejected.count || 0,
    suspended: suspended.count || 0,
  };

  // For approved sellers, also fetch their financial summaries from the ledger
  let sellerFinancials: Record<string, any> = {};
  if (activeTab === "approved" && filteredSellers.length > 0) {
    const sellerIds = filteredSellers.map(s => s.id);
    const { data: ledger } = await supabaseAdmin
      .from("financial_ledger")
      .select("seller_id, transaction_type, amount")
      .in("seller_id", sellerIds);

    if (ledger) {
      for (const entry of ledger) {
        if (!sellerFinancials[entry.seller_id]) {
          sellerFinancials[entry.seller_id] = { gross: 0, commission: 0, earnings: 0, pendingSettlement: 0, settled: 0 };
        }
        const f = sellerFinancials[entry.seller_id];
        const amt = Number(entry.amount);
        switch (entry.transaction_type) {
          case 'SALE_GROSS': f.gross += amt; break;
          case 'ICONJ_COMMISSION': f.commission += Math.abs(amt); break;
          case 'SELLER_EARNING': f.earnings += amt; break;
          case 'SETTLEMENT_PENDING': f.pendingSettlement += amt; break;
          case 'SETTLEMENT_SUCCESSFUL': f.settled += amt; f.pendingSettlement -= amt; break;
        }
      }
    }

    // Also fetch product counts and order counts
    for (const sid of sellerIds) {
      const { count: pCount } = await supabaseAdmin.from("products").select("id", { count: "exact", head: true }).eq("seller_id", sid);
      const { count: oCount } = await supabaseAdmin.from("order_items").select("id", { count: "exact", head: true }).eq("seller_id", sid);
      if (!sellerFinancials[sid]) sellerFinancials[sid] = { gross: 0, commission: 0, earnings: 0, pendingSettlement: 0, settled: 0 };
      sellerFinancials[sid].productCount = pCount || 0;
      sellerFinancials[sid].orderCount = oCount || 0;
    }
  }

  // Server Actions for Seller Approvals
  async function approveSeller(formData: FormData) {
    "use server";
    const sellerId = formData.get("seller_id") as string;
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    
    await supabaseAdmin.from("sellers").update({ status: "approved" }).eq("id", sellerId);
    await supabaseAdmin.from("stores").update({ is_active: true }).eq("seller_id", sellerId);
    await supabaseAdmin.from("seller_verifications").update({ status: "approved" }).eq("seller_id", sellerId);

    // Ensure wallet exists for newly approved seller
    try {
      const { ensureWalletExists } = await import("@/lib/wallet");
      await ensureWalletExists(sellerId);
    } catch (err) {
      console.error("Failed to create wallet for seller", err);
    }

    // Get seller profile to send email
    const { data: seller } = await supabaseAdmin
      .from("sellers")
      .select("profile_id, stores(slug)")
      .eq("id", sellerId)
      .single();

    if (seller) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("email, full_name")
        .eq("id", seller.profile_id)
        .single();
      
      const storeSlug = seller.stores?.[0]?.slug;

      if (profile?.email) {
        // Send approval email
        const { sendEmailTo } = await import("@/lib/email");
        await sendEmailTo(profile.email, 
          "Your ICONJ Seller Account is Approved!",
          `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
              <h2 style="color: #10b981;">Congratulations ${profile.full_name || ''}! 🎉</h2>
              <p>Your seller account on ICONJ has been approved. Your KYC documents have been verified.</p>
              <p style="background: #f8fafc; padding: 15px; border-left: 4px solid #f97316; margin: 20px 0;">
                You can now start listing products and selling to customers across Nigeria.
              </p>
              <div style="margin: 30px 0;">
                <a href="https://iconj-web-rust.vercel.app/seller" style="background: #f97316; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                  Go to Seller Dashboard 🚀
                </a>
              </div>
              ${storeSlug ? `<p style="color: #64748b; font-size: 14px;">Your public store: <a href="https://iconj-web-rust.vercel.app/store/${storeSlug}">iconj-web-rust.vercel.app/store/${storeSlug}</a></p>` : ""}
              <p style="color: #94a3b8; font-size: 13px; margin-top: 30px;">— The ICONJ Team</p>
            </div>
          `
        );
      }
    }

    revalidatePath("/admin/sellers");
  }

  async function rejectSeller(formData: FormData) {
    "use server";
    const sellerId = formData.get("seller_id") as string;
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    
    await supabaseAdmin.from("sellers").update({ status: "rejected" }).eq("id", sellerId);
    await supabaseAdmin.from("seller_verifications").update({ status: "rejected" }).eq("seller_id", sellerId);
    revalidatePath("/admin/sellers");
  }

  async function suspendSeller(formData: FormData) {
    "use server";
    const sellerId = formData.get("seller_id") as string;
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    
    await supabaseAdmin.from("sellers").update({ status: "suspended" }).eq("id", sellerId);
    await supabaseAdmin.from("stores").update({ is_active: false }).eq("seller_id", sellerId);
    revalidatePath("/admin/sellers");
  }

  async function reactivateSeller(formData: FormData) {
    "use server";
    const sellerId = formData.get("seller_id") as string;
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    
    await supabaseAdmin.from("sellers").update({ status: "approved" }).eq("id", sellerId);
    await supabaseAdmin.from("stores").update({ is_active: true }).eq("seller_id", sellerId);
    revalidatePath("/admin/sellers");
  }

  async function clearAllSellers() {
    "use server";
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    // Delete in correct order to avoid FK violations
    await supabaseAdmin.from("financial_ledger").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("commissions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    
    // Wallet Engine Tables
    await supabaseAdmin.from("refunds").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("wallet_transactions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("withdrawal_requests").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("seller_wallets").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    
    await supabaseAdmin.from("seller_payout_accounts").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("seller_verifications").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("wholesale_pricing").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    // Delete seller products (but NOT admin products)
    const { data: allSellers } = await supabaseAdmin.from("sellers").select("id");
    if (allSellers) {
      for (const s of allSellers) {
        await supabaseAdmin.from("products").delete().eq("seller_id", s.id);
      }
    }
    await supabaseAdmin.from("stores").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("sellers").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    // Clean up businesses that no longer have sellers
    await supabaseAdmin.from("businesses").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    revalidatePath("/admin/sellers");
  }

  const formatCurrency = (val: number) => `₦${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const tabs = [
    { key: "pending", label: "Pending", count: counts.pending, color: "bg-amber-500" },
    { key: "approved", label: "Approved", count: counts.approved, color: "bg-emerald-500" },
    { key: "rejected", label: "Rejected", count: counts.rejected, color: "bg-red-500" },
    { key: "suspended", label: "Suspended", count: counts.suspended, color: "bg-slate-500" },
  ];

  return (
    <main className="flex-1 p-4 md:p-8 overflow-auto bg-slate-50 min-h-[calc(100vh-130px)]">
      <div className="mb-8 flex flex-col md:flex-row justify-between md:items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sellers</h1>
          <p className="text-sm text-slate-500">Manage all marketplace sellers — approvals, finances, and Paystack connections.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <LiveSearch placeholder="Search business, store, email..." />
          <ClearAllSellersButton action={clearAllSellers} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b border-slate-200 pb-0">
        {tabs.map(tab => (
          <Link
            key={tab.key}
            href={`/admin/sellers?tab=${tab.key}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-lg border border-b-0 transition-colors ${
              activeTab === tab.key
                ? "bg-white text-slate-900 border-slate-200"
                : "bg-transparent text-slate-500 border-transparent hover:text-slate-700"
            }`}
          >
            {tab.label}
            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full text-white ${tab.color}`}>
              {tab.count}
            </span>
          </Link>
        ))}
      </div>

      <div className="space-y-6">
        {filteredSellers && filteredSellers.length > 0 ? (
          filteredSellers.map((seller: any) => {
            const payout = seller.seller_payout_accounts?.[0];
            const fin = sellerFinancials[seller.id];
            const hasPaystack = !!payout?.paystack_subaccount_code;

            return (
                <details key={seller.id} className={`group bg-white rounded-lg shadow-sm overflow-hidden border transition-all ${
                  activeTab === "pending" ? "border-amber-200" :
                  activeTab === "approved" ? "border-emerald-200" :
                  activeTab === "rejected" ? "border-red-200" : "border-slate-300"
                }`}>
                  {/* Header Bar / Summary Row */}
                  <summary className={`px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden hover:bg-slate-50 transition-colors ${
                    activeTab === "pending" ? "bg-amber-50/50" :
                    activeTab === "approved" ? "bg-emerald-50/50" :
                    activeTab === "rejected" ? "bg-red-50/50" : "bg-slate-50"
                  }`}>
                    <div className="flex items-center gap-4 flex-1">
                      <Badge variant="outline" className={`text-xs whitespace-nowrap ${
                        activeTab === "pending" ? "bg-amber-100 text-amber-800 border-amber-300" :
                        activeTab === "approved" ? "bg-emerald-100 text-emerald-800 border-emerald-300" :
                        activeTab === "rejected" ? "bg-red-100 text-red-800 border-red-300" : "bg-slate-200 text-slate-700 border-slate-300"
                      }`}>
                        {seller.status?.toUpperCase().replace("_", " ")}
                      </Badge>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 flex-1 overflow-hidden">
                        <span className="font-bold text-slate-900 truncate">
                          {seller.businesses?.business_name || "Unknown Business"}
                        </span>
                        <span className="text-sm text-slate-500 truncate hidden md:block">
                          {seller.stores?.[0]?.store_name || "No Store Setup"}
                        </span>
                        <span className="text-sm text-slate-500 truncate hidden lg:block">
                          {seller.profiles?.email}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm font-medium text-blue-600 shrink-0">
                      <span className="text-xs text-slate-500 hidden sm:block">
                        Since {new Date(seller.created_at).toLocaleDateString()}
                      </span>
                      <span className="group-open:hidden flex items-center gap-1">View Details ▾</span>
                      <span className="hidden group-open:flex items-center gap-1">Hide Details ▴</span>
                    </div>
                  </summary>
  
                  <div className="p-6 border-t border-slate-100 bg-white">
                    <div className="grid md:grid-cols-3 gap-8">
                    {/* Business Details */}
                    <div className="space-y-4">
                      <h3 className="font-bold text-slate-900 border-b pb-2 flex items-center gap-2">
                        <Store className="w-4 h-4 text-slate-400" /> Business Profile
                      </h3>
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
                      <div>
                        <p className="text-xs text-slate-500">Phone Number</p>
                        <p className="font-medium">{seller.businesses?.address?.phone || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Address</p>
                        <p className="font-medium">{seller.businesses?.address?.street}, {seller.businesses?.address?.city}, {seller.businesses?.address?.state}</p>
                      </div>
                    </div>

                    {/* Payout & Paystack (for approved sellers) OR KYC (for pending) */}
                    {activeTab === "approved" ? (
                      <div className="space-y-4">
                        <h3 className="font-bold text-slate-900 border-b pb-2 flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-slate-400" /> Payout & Paystack
                        </h3>
                        {payout ? (
                          <>
                            <div>
                              <p className="text-xs text-slate-500">Bank</p>
                              <p className="font-medium">{payout.bank_name}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">Account</p>
                              <p className="font-medium font-mono">••••{payout.account_number?.slice(-4)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">Account Name</p>
                              <p className="font-medium">{payout.verified_name}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">Paystack Status</p>
                              {hasPaystack ? (
                                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">🟢 Connected</Badge>
                              ) : (
                                <Badge className="bg-amber-100 text-amber-800 border-amber-300">🟡 Pending Platform Upgrade</Badge>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="bg-slate-100 p-4 rounded-lg text-sm text-slate-500 italic">
                            <AlertTriangle className="w-4 h-4 inline mr-1 text-amber-500" />
                            Seller has not yet linked a payout account.
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <h3 className="font-bold text-slate-900 border-b pb-2 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-slate-400" /> KYC Documents
                        </h3>
                        <div className="space-y-2">
                          {seller.seller_verifications?.map((doc: any, i: number) => (
                            <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 border rounded-md text-sm">
                              <FileText className="w-4 h-4 text-blue-600" />
                              <div className="flex-1 truncate">
                                <span className="font-semibold text-slate-700">{doc.document_type}:</span> 
                                <a href={doc.document_url} target="_blank" rel="noopener noreferrer" className="ml-1 text-blue-600 hover:underline">
                                  View Document
                                </a>
                              </div>
                            </div>
                          ))}
                          {(!seller.seller_verifications || seller.seller_verifications.length === 0) && (
                            <p className="text-sm text-slate-500 italic">No documents uploaded.</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Finance OR Actions */}
                    <div className="space-y-4 flex flex-col h-full">
                      {activeTab === "approved" && fin ? (
                        <>
                          <h3 className="font-bold text-slate-900 border-b pb-2 flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-slate-400" /> Financials
                          </h3>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="bg-blue-50 p-3 rounded-lg">
                              <p className="text-xs text-blue-600 font-medium">Products</p>
                              <p className="text-lg font-bold text-blue-900">{fin.productCount}</p>
                            </div>
                            <div className="bg-blue-50 p-3 rounded-lg">
                              <p className="text-xs text-blue-600 font-medium">Orders</p>
                              <p className="text-lg font-bold text-blue-900">{fin.orderCount}</p>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-lg">
                              <p className="text-xs text-slate-500">Gross Sales</p>
                              <p className="font-bold text-slate-900">{formatCurrency(fin.gross)}</p>
                            </div>
                            <div className="bg-red-50 p-3 rounded-lg">
                              <p className="text-xs text-red-500">ICONJ Commission</p>
                              <p className="font-bold text-red-700">{formatCurrency(fin.commission)}</p>
                            </div>
                            <div className="bg-emerald-50 p-3 rounded-lg">
                              <p className="text-xs text-emerald-600">Net Earnings</p>
                              <p className="font-bold text-emerald-800">{formatCurrency(fin.earnings)}</p>
                            </div>
                            <div className="bg-amber-50 p-3 rounded-lg">
                              <p className="text-xs text-amber-600">Pending Payout</p>
                              <p className="font-bold text-amber-800">{formatCurrency(fin.pendingSettlement)}</p>
                            </div>
                          </div>
                          <div className="pt-4 border-t mt-auto">
                            <form action={suspendSeller}>
                              <input type="hidden" name="seller_id" value={seller.id} />
                              <Button type="submit" variant="outline" className="w-full border-red-200 text-red-600 hover:bg-red-50" size="sm">
                                Suspend Seller
                              </Button>
                            </form>
                          </div>
                        </>
                      ) : activeTab === "pending" ? (
                        <>
                          <h3 className="font-bold text-slate-900 border-b pb-2">Actions</h3>
                          <div className="flex-1" />
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
                        </>
                      ) : activeTab === "suspended" ? (
                        <>
                          <h3 className="font-bold text-slate-900 border-b pb-2">Actions</h3>
                          <div className="flex-1" />
                          <div className="pt-4 border-t mt-auto">
                            <form action={reactivateSeller}>
                              <input type="hidden" name="seller_id" value={seller.id} />
                              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
                                <CheckCircle className="w-4 h-4 mr-2" /> Reactivate Seller
                              </Button>
                            </form>
                          </div>
                        </>
                      ) : (
                        <div className="space-y-4">
                          <h3 className="font-bold text-slate-900 border-b pb-2">Info</h3>
                          <p className="text-sm text-slate-500 italic">This application was rejected. The seller may reapply.</p>
                        </div>
                      )}
                    </div>
                    </div>
                  </div>
                </details>
              );
          })
        ) : (
          <Card className="border-dashed border-2 shadow-none bg-slate-50">
            <CardContent className="flex flex-col items-center justify-center py-16 text-slate-500">
              <Users className="w-12 h-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-bold text-slate-700">No {activeTab} sellers</h3>
              <p>There are no sellers in the &quot;{activeTab}&quot; category right now.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
