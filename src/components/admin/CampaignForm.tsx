"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { createCampaign, updateCampaign, deleteCampaign } from "@/app/admin/marketing/actions";

export function CampaignForm({ campaign = {} as any }: { campaign?: any }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Helper to convert DB UTC string to local browser YYYY-MM-DDThh:mm for the input
  const getLocalDatetime = (utcString?: string) => {
    if (!utcString) return "";
    try {
      const d = new Date(utcString);
      const tzOffset = d.getTimezoneOffset() * 60000;
      return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
    } catch (e) {
      return "";
    }
  };

  const [formData, setFormData] = useState({
    title: campaign?.title || "",
    subject: campaign?.subject || "",
    html_content: campaign?.html_content || "<h1>Hello!</h1><p>Your content here</p>",
    status: campaign?.status || "DRAFT",
    target_audience: campaign?.target_audience || "ALL",
    scheduled_for: getLocalDatetime(campaign?.scheduled_for),
  });

  const [segments, setSegments] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
    fetch('/api/admin/segments')
      .then(res => res.json())
      .then(data => {
        if (data.segments) setSegments(data.segments);
      })
      .catch(console.error);
  }, []);

  if (!mounted) {
    return <div className="p-6 bg-white rounded-lg shadow-sm border border-slate-200 h-96 flex items-center justify-center text-slate-500">Loading editor...</div>;
  }

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

  const handleDelete = async () => {
    if (!campaign?.id) return;
    if (!window.confirm("Are you sure you want to delete this campaign? This action cannot be undone.")) return;
    
    setLoading(true);
    try {
      await deleteCampaign(campaign.id);
      toast.success("Campaign deleted");
      router.push('/admin/marketing');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
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
            {segments.map(seg => (
              <option key={seg.id} value={seg.id}>{seg.name} (Custom Segment)</option>
            ))}
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

      <div className="flex justify-between items-center pt-6">
        <div>
          {campaign?.id && (
            <button 
              type="button" 
              onClick={handleDelete}
              disabled={loading}
              className="px-4 py-2 border border-red-200 text-red-600 rounded font-medium hover:bg-red-50 disabled:opacity-50"
            >
              Delete Campaign
            </button>
          )}
        </div>
        <div className="flex gap-3">
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
      </div>

    </form>
  );
}
