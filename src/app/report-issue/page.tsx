"use client";

import { useState, useEffect } from "react";
import { AlertCircle, Upload, CheckCircle2, ChevronRight, X } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { getUserOrdersForIssues, submitOrderIssue } from "./actions";

export default function ReportIssuePage() {
  const [supabase] = useState(() => createClient());
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    order_id: "",
    issue_type: "",
    description: "",
  });
  
  const [files, setFiles] = useState<File[]>([]);
  const [reference, setReference] = useState("");

  useEffect(() => {
    async function loadOrders() {
      const res = await getUserOrdersForIssues();
      
      if (res.error === "Not logged in") {
        window.location.href = "/login?redirect=/report-issue";
        return;
      }
      
      if (res.userId) setUserId(res.userId);
      if (res.orders) setUserOrders(res.orders);
    }
    loadOrders();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles].slice(0, 5)); // max 5 files
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.order_id || !formData.issue_type || !formData.description) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Upload evidence if any
      const evidence_urls: string[] = [];
      for (const file of files) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        const { error: uploadError, data } = await supabase.storage
          .from("issue-evidence")
          .upload(fileName, file);
          
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage.from("issue-evidence").getPublicUrl(fileName);
        evidence_urls.push(publicUrl);
      }

      // 2. Create Issue record via Server Action
      const res = await submitOrderIssue({
        order_id: formData.order_id,
        issue_type: formData.issue_type,
        description: formData.description,
        evidence_urls
      });

      if (res.error) {
        throw new Error(res.error);
      }

      setReference(res.id.split("-")[0].toUpperCase());
      setSuccess(true);
      
      // Send email notification
      fetch('/api/notify-issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: formData.order_id,
          issue_type: formData.issue_type,
          description: formData.description
        })
      }).catch(console.error);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4">
        <div className="bg-white max-w-md w-full rounded-2xl shadow-lg border p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">Issue Submitted</h1>
          <p className="text-slate-600 mb-6">We have received your report and our support team is reviewing it.</p>
          
          <div className="bg-slate-50 p-4 rounded-lg text-left border mb-8">
            <p className="text-sm text-slate-500 mb-1">Reference Number:</p>
            <p className="font-mono font-bold text-lg text-slate-900 mb-4">{reference}</p>
            <p className="text-sm text-slate-500 mb-1">Next Steps:</p>
            <p className="text-sm font-medium text-slate-700">We will contact you via email or phone within 24 hours. You can track this issue from your account dashboard.</p>
          </div>
          
          <Link href="/account" className="block w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors">
            Go to My Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-4 font-medium">
            <Link href="/" className="hover:text-blue-600">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-slate-900">Report an Issue</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <AlertCircle className="w-8 h-8 text-orange-500" /> Report an Order Issue
          </h1>
          <p className="text-slate-500 mt-2">Notice a defect, damage, or missing part? Let us know so we can fix it.</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6 md:p-8">
          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 border border-red-200 text-sm font-medium">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">Which order has an issue?</label>
              <select 
                required
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.order_id}
                onChange={e => setFormData({...formData, order_id: e.target.value})}
              >
                <option value="" disabled>Select an order...</option>
                {userOrders.map(order => (
                  <option key={order.id} value={order.id}>
                    Order #{order.id.substring(0,8).toUpperCase()} ({new Date(order.created_at).toLocaleDateString()}) - {order.order_status}
                  </option>
                ))}
              </select>
              {userOrders.length === 0 && <p className="text-xs text-amber-600 mt-1">You have no previous orders.</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">What kind of issue is this?</label>
              <select 
                required
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.issue_type}
                onChange={e => setFormData({...formData, issue_type: e.target.value})}
              >
                <option value="" disabled>Select issue type...</option>
                <option value="Damaged Product">Damaged Product (During delivery)</option>
                <option value="Defective Product">Defective Product (Not working)</option>
                <option value="Missing Component">Missing Component/Part</option>
                <option value="Wrong Item">Received Wrong Item/Color</option>
                <option value="Incorrect Configuration">Incorrect Configuration (Wrong size cut)</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">Describe the problem in detail</label>
              <Textarea 
                required
                placeholder="Please provide specific details about what is wrong..."
                className="h-32"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-dashed border-slate-300">
              <label className="block text-sm font-bold text-slate-900 mb-1">Upload Evidence (Photos/Videos)</label>
              <p className="text-xs text-slate-500 mb-4">Please provide clear photos showing the defect and original packaging. Helps speed up resolution. (Max 5 files)</p>
              
              <div className="flex flex-wrap gap-3 mb-3">
                {files.map((file, idx) => (
                  <div key={idx} className="relative w-20 h-20 rounded bg-slate-200 border overflow-hidden flex items-center justify-center">
                    {file.type.startsWith("image/") ? (
                      <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs text-slate-500 font-medium break-all px-1 text-center">{file.name}</span>
                    )}
                    <button type="button" onClick={() => removeFile(idx)} className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                
                {files.length < 5 && (
                  <label className="w-20 h-20 rounded border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 hover:border-slate-400 transition-colors">
                    <Upload className="w-5 h-5 text-slate-400 mb-1" />
                    <span className="text-[10px] font-medium text-slate-500">Add File</span>
                    <input type="file" multiple accept="image/*,video/mp4" className="hidden" onChange={handleFileChange} />
                  </label>
                )}
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg font-bold">
              {loading ? "Submitting Issue..." : "Submit Issue"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

