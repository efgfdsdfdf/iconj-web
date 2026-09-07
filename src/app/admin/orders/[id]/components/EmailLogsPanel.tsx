"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mail, RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";

export function EmailLogsPanel({ orderId }: { orderId: string }) {
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState<string | null>(null);

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/emails?orderId=${orderId}`);
      const data = await res.json();
      setEmails(data.emails || []);
    } catch (e) {
      console.error("Failed to fetch emails", e);
    }
    setLoading(false);
  };

  useEffect(() => { fetchEmails(); }, [orderId]);

  const retryEmail = async (emailId: string) => {
    setRetrying(emailId);
    try {
      const res = await fetch("/api/admin/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailId }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Email resent successfully!");
      } else {
        alert("Failed to resend: " + (data.error || "Unknown error"));
      }
      fetchEmails();
    } catch (e) {
      alert("Error retrying email");
    }
    setRetrying(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SENT": return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      case "FAILED": return <XCircle className="w-4 h-4 text-red-600" />;
      case "PENDING": return <Clock className="w-4 h-4 text-amber-600" />;
      default: return <AlertTriangle className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SENT": return "bg-emerald-50 text-emerald-700";
      case "FAILED": return "bg-red-50 text-red-700";
      case "PENDING": return "bg-amber-50 text-amber-700";
      default: return "bg-slate-50 text-slate-700";
    }
  };

  return (
    <div className="bg-white border rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <Mail className="w-5 h-5 text-blue-600" />
          Email Notifications
        </h3>
        <Button variant="outline" size="sm" onClick={fetchEmails} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {loading && emails.length === 0 ? (
        <p className="text-sm text-slate-500">Loading email logs...</p>
      ) : emails.length === 0 ? (
        <p className="text-sm text-slate-500">No email notifications recorded for this order.</p>
      ) : (
        <div className="space-y-3">
          {emails.map((email: any) => (
            <div key={email.id} className="flex items-center justify-between border rounded-lg p-3">
              <div className="flex items-center gap-3">
                {getStatusIcon(email.status)}
                <div>
                  <p className="font-medium text-sm">{email.email_type.replace(/_/g, " ")}</p>
                  <p className="text-xs text-slate-500">
                    To: {email.recipient_email} • {new Date(email.created_at).toLocaleString()}
                  </p>
                  {email.error_message && (
                    <p className="text-xs text-red-500 mt-1">Error: {email.error_message}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-2 py-1 rounded ${getStatusColor(email.status)}`}>
                  {email.status}
                </span>
                {email.status === "FAILED" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                    onClick={() => retryEmail(email.id)}
                    disabled={retrying === email.id}
                  >
                    <RefreshCw className={`w-3 h-3 mr-1 ${retrying === email.id ? "animate-spin" : ""}`} />
                    Retry
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
