import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/auth/admin";
import { PayoutModeSettings } from "./PayoutModeSettings";

import { QuotationSettings } from "./QuotationSettings";

export const revalidate = 0;

export default async function AdminSettingsPage() {
  await requireAdmin();
  
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  const { data: walletSettings } = await supabaseAdmin
    .from('wallet_settings')
    .select('*')
    .single();

  return (
    <main className="flex-1 p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Platform Settings</h1>
        <p className="text-sm text-slate-500">Configure global marketplace behavior.</p>
      </div>
      
      <div className="space-y-6 max-w-4xl">
        <PayoutModeSettings currentMode={walletSettings?.payout_mode || 'MANUAL'} />
        <QuotationSettings />
      </div>
    </main>
  );
}
