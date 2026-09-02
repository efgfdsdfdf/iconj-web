"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updateIssue } from "@/app/admin/actions";
import { CheckCircle2, Mail } from "lucide-react";

export function IssueStatusForm({ issue }: { issue: any }) {
  const [status, setStatus] = useState(issue.status);
  const [notes, setNotes] = useState(issue.admin_notes || "");
  const [sendEmail, setSendEmail] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const res = await updateIssue(issue.id, { status, admin_notes: notes }, sendEmail);
    if (res.success) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError(res.error || "Failed to update issue");
    }
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader className="bg-slate-50 border-b pb-4">
        <CardTitle className="text-lg">Update Resolution Status</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">{error}</div>}
        {success && <div className="bg-emerald-50 text-emerald-600 p-3 rounded mb-4 text-sm flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/> Update saved{sendEmail ? " & email sent to customer!" : " successfully"}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-900 mb-2">Current Status</label>
            <select 
              className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              value={status}
              onChange={e => setStatus(e.target.value)}
            >
              <option value="Submitted">Submitted</option>
              <option value="Under Review">Under Review</option>
              <option value="Contacting Supplier">Contacting Supplier</option>
              <option value="Waiting for Customer">Waiting for Customer</option>
              <option value="Replacement in Progress">Replacement in Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-900 mb-2">Response / Message to Customer</label>
            <p className="text-xs text-slate-500 mb-2">This message will be visible to the customer in their dashboard, and optionally emailed to them.</p>
            <Textarea 
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="E.g. We have contacted the supplier and they are remaking the item..."
              className="h-28"
            />
          </div>

          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <input
              type="checkbox"
              id="sendEmail"
              checked={sendEmail}
              onChange={e => setSendEmail(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 cursor-pointer"
            />
            <label htmlFor="sendEmail" className="flex items-center gap-2 text-sm font-medium text-blue-800 cursor-pointer">
              <Mail className="w-4 h-4" />
              Send email notification to customer ({issue.profiles?.email})
            </label>
          </div>

          <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold w-full md:w-auto">
            {loading ? "Saving..." : sendEmail ? "Save & Send Email" : "Save Update"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}


