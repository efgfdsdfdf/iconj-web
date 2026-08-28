"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, CheckCircle2, AlertTriangle, Clock, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { resendOrderEmail } from "../actions/resend-email";

const EMAIL_TYPE_LABELS: Record<string, string> = {
  PAYMENT_RECEIPT: 'Payment Receipt',
  ORDER_PROCESSING: 'Order Processing',
  SENT_TO_SUPPLIER: 'Sent for Fulfillment',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
};

export function EmailHistory({ orderId, emails }: { orderId: string; emails: any[] }) {
  const [resending, setResending] = useState<string | null>(null);
  const router = useRouter();

  const handleResend = async (emailType: string) => {
    setResending(emailType);
    try {
      const result = await resendOrderEmail(orderId, emailType);
      if (result?.success) {
        router.refresh();
      } else {
        const errMsg = 'error' in result ? result.error : 'Unknown error';
        alert("Failed to resend: " + errMsg);
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setResending(null);
    }
  };

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="border-b pb-4">
        <CardTitle className="text-lg flex items-center">
          <Mail className="w-4 h-4 mr-2" /> Email Notifications
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {emails.length === 0 ? (
          <p className="text-sm text-slate-500">No emails sent yet.</p>
        ) : (
          <div className="space-y-3">
            {emails.map((email: any) => (
              <div key={email.id} className="flex items-center justify-between gap-2 text-sm">
                  <div className="flex flex-col min-w-0">
                    <span className="font-medium text-slate-900 truncate flex items-center gap-2">
                      {email.status === 'SENT' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : email.status === 'FAILED' ? (
                        <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                      ) : (
                        <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                      )}
                      {EMAIL_TYPE_LABELS[email.email_type] || email.email_type}
                    </span>
                    {email.recipient_email && (
                      <span className="text-[10px] text-slate-500 ml-6 truncate font-mono">
                        to: {email.recipient_email}
                      </span>
                    )}
                  </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    email.status === 'SENT' ? 'bg-emerald-100 text-emerald-700' :
                    email.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {email.status}
                  </span>
                  {(email.status === 'FAILED' || email.status === 'SENT') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      disabled={resending === email.email_type}
                      onClick={() => handleResend(email.email_type)}
                      title="Resend email"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${resending === email.email_type ? 'animate-spin' : ''}`} />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
