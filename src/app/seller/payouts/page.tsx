import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PayoutClient } from "./PayoutClient";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PayoutsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return redirect("/login");

  const { data: seller } = await supabase
    .from("sellers")
    .select("id")
    .eq("profile_id", user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!seller) return redirect("/account");

  // Get primary payout account
  const { data: payoutAccount } = await supabase
    .from("seller_payout_accounts")
    .select("*")
    .eq("seller_id", seller.id)
    .eq("is_primary", true)
    .maybeSingle();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Payout Account</h1>
        <p className="text-slate-500 mt-1">Manage where your marketplace earnings are sent.</p>
      </div>
      
      <PayoutClient existingAccount={payoutAccount} />
    </div>
  );
}
