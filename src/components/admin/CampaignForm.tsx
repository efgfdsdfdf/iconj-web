"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { createCampaign, updateCampaign } from "@/app/admin/marketing/actions";

export function CampaignForm({ campaign = {} as any }: { campaign?: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: campaign?.title || "",
    subject: campaign?.subject || "",
    html_content: campaign?.html_content || "<h1>Hello!</h1><p>Your content here</p>",
    status: campaign?.status || "DRAFT",
    target_audience: campaign?.target_audience || "ALL",
    scheduled_for: campaign?.scheduled_for ? new Date(campaign.scheduled_for).toISOString().slice(0, 16) : "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const payload = {
        ...formData,
        scheduled_for: formData.scheduled_for ? new Date(formData.scheduled_for).toISOString() : null
      };

      if (campaign?.id) {
        await updateCampaign(campaign.id, payload);
        toast.success("Campaign updated");
      } else {
        await createCampaign(payload);
        toast.success("Campaign created");
      }
      router.push('/admin/marketing');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 max-w-4xl space-y-6">
      
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Campaign Title (Internal)</label>
          <input 
            type="text" 
            required
            value={formData.title}
            onChange={e => setFormData({...formData, title: e.target.value})}
            className="w-full border p-2 rounded focus:ring-2 focus:ring-orange-500" 
            placeholder="e.g., Black Friday 2026"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Target Audience</label>
          <select 
            value={formData.target_audience}
            onChange={e => setFormData({...formData, target_audience: e.target.value})}
            className="w-full border p-2 rounded focus:ring-2 focus:ring-orange-500"
          >
            <option value="ALL">All Customers</option>
            <option value="VIP">VIPs only (High Spend)</option>
            <option value="NO_PURCHASE">Users with no purchases</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Email Subject Line</label>
        <input 
          type="text" 
          required
          value={formData.subject}
          onChange={e => setFormData({...formData, subject: e.target.value})}
          className="w-full border p-2 rounded focus:ring-2 focus:ring-orange-500" 
          placeholder="e.g., Massive 50% Off ICONJ Blinds!"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">HTML Content</label>
        <textarea 
          required
          rows={15}
          value={formData.html_content}
          onChange={e => setFormData({...formData, html_content: e.target.value})}
          className="w-full border p-2 rounded font-mono text-sm focus:ring-2 focus:ring-orange-500" 
        />
        <p className="text-xs text-slate-500 mt-1">Note: This will be wrapped in the standard ICONJ email template (header/footer).</p>
      </div>

      <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-100">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
          <select 
            value={formData.status}
            onChange={e => setFormData({...formData, status: e.target.value})}
            className="w-full border p-2 rounded focus:ring-2 focus:ring-orange-500"
          >
            <option value="DRAFT">Draft</option>
            <option value="SCHEDULED">Scheduled (Ready to send)</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Scheduled Date & Time</label>
          <input 
            type="datetime-local" 
            value={formData.scheduled_for}
            onChange={e => setFormData({...formData, scheduled_for: e.target.value})}
            className="w-full border p-2 rounded focus:ring-2 focus:ring-orange-500" 
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6">
        <button 
          type="button" 
          onClick={() => router.push('/admin/marketing')}
          className="px-4 py-2 border rounded font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button 
          type="submit" 
          disabled={loading}
          className="px-6 py-2 bg-orange-600 text-white rounded font-medium hover:bg-orange-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Campaign'}
        </button>
      </div>

    </form>
  );
}
