"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { updatePayoutMode } from "./actions";
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

export function PayoutModeSettings({ currentMode }: { currentMode: 'MANUAL' | 'PAYSTACK_TRANSFER' }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSwitch = async (mode: 'MANUAL' | 'PAYSTACK_TRANSFER') => {
    setLoading(true);
    await updatePayoutMode(mode);
    setLoading(false);
    router.refresh();
  };

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle>Seller Payout Mode</CardTitle>
        <CardDescription>Control how sellers receive their withdrawn funds.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${currentMode === 'PAYSTACK_TRANSFER' ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`} onClick={() => handleSwitch('PAYSTACK_TRANSFER')}>
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-slate-900">Automatic (Paystack)</h3>
              {currentMode === 'PAYSTACK_TRANSFER' && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
            </div>
            <p className="text-sm text-slate-600">
              When you approve a payout, the system will automatically transfer the funds directly to the seller's bank account via Paystack Transfers.
            </p>
          </div>

          <div className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${currentMode === 'MANUAL' ? 'border-amber-500 bg-amber-50' : 'border-slate-200 hover:border-slate-300'}`} onClick={() => handleSwitch('MANUAL')}>
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-slate-900">Manual Transfers</h3>
              {currentMode === 'MANUAL' && <CheckCircle2 className="w-5 h-5 text-amber-600" />}
            </div>
            <p className="text-sm text-slate-600">
              You must log into your own bank app and wire the money to the seller manually. Then, click "Mark as Paid" in the dashboard.
            </p>
          </div>
        </div>
        
        {loading && <div className="flex items-center text-sm text-slate-500"><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving changes...</div>}
      </CardContent>
    </Card>
  );
}
