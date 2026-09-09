import { CampaignForm } from "@/components/admin/CampaignForm";
import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";

export default async function EditCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: campaign, error } = await supabase
    .from('email_campaigns')
    .select('*')
    .eq('id', resolvedParams.id)
    .single();

  if (error || !campaign) {
    notFound();
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Edit Campaign</h1>
        <p className="text-slate-600">{campaign.title}</p>
      </div>
      <CampaignForm campaign={campaign} />
    </div>
  );
}
