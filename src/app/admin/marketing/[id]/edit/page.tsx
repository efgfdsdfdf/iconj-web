import { CampaignForm } from "@/components/admin/CampaignForm";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export default async function EditCampaignPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: campaign, error } = await supabase
    .from('email_campaigns')
    .select('*')
    .eq('id', params.id)
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
