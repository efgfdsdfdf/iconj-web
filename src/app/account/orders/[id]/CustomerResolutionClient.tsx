"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

export function CustomerResolutionClient({ issueId, priceDifference }: { issueId: string, priceDifference: number }) {
  const [loading, setLoading] = useState<"ACCEPT" | "REJECT" | null>(null);

  const handleDecision = async (decision: "ACCEPT" | "REJECT") => {
    setLoading(decision);
    try {
      const res = await fetch("/api/account/orders/exception", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issueId, decision })
      });
      if (!res.ok) throw new Error("Failed to submit decision");
      
      toast.success(decision === "ACCEPT" ? "Alternative accepted. Order will proceed to fulfillment." : "Resolution requested. Our support team will contact you.");
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message);
      setLoading(null);
    }
  };

  return (
    <div>
      {Number(priceDifference) > 0 && (
        <p className="text-sm text-red-700 mb-4 font-semibold italic">
          * Note: Accepting this alternative requires an additional payment of ?{Number(priceDifference).toLocaleString()}. Our support team will send you a secure payment link after you accept.
        </p>
      )}
      {Number(priceDifference) < 0 && (
        <p className="text-sm text-emerald-700 mb-4 font-semibold italic">
          * Note: Accepting this alternative includes a refund of ?{Math.abs(Number(priceDifference)).toLocaleString()} to your original payment method or wallet.
        </p>
      )}
      
      <div className="flex flex-col sm:flex-row gap-4 mt-2">
        <Button 
          onClick={() => handleDecision("ACCEPT")}
          disabled={loading !== null}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 h-12"
        >
          {loading === "ACCEPT" ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <CheckCircle className="w-5 h-5 mr-2" />}
          Accept Alternative
        </Button>
        <Button 
          onClick={() => handleDecision("REJECT")}
          disabled={loading !== null}
          variant="outline"
          className="border-red-200 text-red-700 hover:bg-red-50 font-bold px-8 h-12"
        >
          {loading === "REJECT" ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <XCircle className="w-5 h-5 mr-2" />}
          Cancel & Request Refund
        </Button>
      </div>
    </div>
  );
}
