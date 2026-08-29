import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { StoreSettingsForm } from "./StoreSettingsForm";

export default async function StoreSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return redirect("/login");

  const { data: seller } = await supabase
    .from("sellers")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  if (!seller) return redirect("/account");

  const { data: store } = await supabase
    .from("stores")
    .select("*")
    .eq("seller_id", seller.id)
    .single();

  return (
    <div className="max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Store Settings</h1>
        <p className="text-slate-500 mt-1">Manage your public store details and policies.</p>
      </div>

      <StoreSettingsForm initialData={store} sellerId={seller.id} />
    </div>
  );
}
