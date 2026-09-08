import { CampaignForm } from "@/components/admin/CampaignForm";

export default function NewCampaignPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">New Campaign</h1>
        <p className="text-slate-600">Create a new seasonal broadcast email.</p>
      </div>
      <CampaignForm />
    </div>
  );
}
