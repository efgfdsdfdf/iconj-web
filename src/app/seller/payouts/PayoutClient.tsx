"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, AlertCircle, Loader2, Building2 } from "lucide-react";

export function PayoutClient({ existingAccount }: { existingAccount: any }) {
  const router = useRouter();
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [resolvedAccount, setResolvedAccount] = useState<any>(null);
  const [verifying, setVerifying] = useState(false);
  const [success, setSuccess] = useState(false);

  // Note: In production, you would fetch this from Paystack's bank list API.
  const commonBanks = [
    { name: "Guaranty Trust Bank (GTB)", code: "058" },
    { name: "Access Bank", code: "044" },
    { name: "Zenith Bank", code: "057" },
    { name: "First Bank of Nigeria", code: "011" },
    { name: "United Bank for Africa (UBA)", code: "033" }
  ];

  const handleResolve = async () => {
    if (!bankCode || !accountNumber) {
      setError("Please select a bank and enter an account number.");
      return;
    }
    
    setLoading(true);
    setError(null);
    setResolvedAccount(null);

    try {
      const res = await fetch("/api/seller/payout/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bank_code: bankCode, account_number: accountNumber })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to resolve account.");

      setResolvedAccount(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    // If we are retrying an existing account, use that data instead of the state
    const isRetry = !!existingAccount;
    const finalBankCode = isRetry ? existingAccount.bank_code : bankCode;
    const finalAccountNumber = isRetry ? existingAccount.account_number : accountNumber;
    const finalAccountName = isRetry ? existingAccount.verified_name : resolvedAccount?.account_name;
    const finalBankName = isRetry ? existingAccount.bank_name : commonBanks.find(b => b.code === bankCode)?.name || bankCode;

    if (!finalBankCode || !finalAccountNumber || !finalAccountName) return;
    
    setVerifying(true);
    setError(null);

    try {
      const res = await fetch("/api/seller/payout/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bank_code: finalBankCode,
          account_number: finalAccountNumber,
          bank_name: finalBankName,
          account_name: finalAccountName
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to verify payout account.");

      setSuccess(true);
      setTimeout(() => {
        router.refresh();
      }, 2000);

    } catch (err: any) {
      setError(err.message);
      setVerifying(false);
    }
  };

  if (existingAccount && existingAccount.status !== 'FAILED') {
    const isReady = existingAccount.status === 'VERIFIED' || existingAccount.paystack_subaccount_code;
    return (
      <Card className="border-slate-200 shadow-sm max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Payout Account
            {isReady ? (
              <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Active
              </span>
            ) : (
              <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Action Required
              </span>
            )}
          </CardTitle>
          <CardDescription>Your verified bank account for marketplace settlements.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-slate-50 p-6 rounded-lg border border-slate-100 flex items-start gap-4">
            <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6 text-slate-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">{existingAccount.verified_name || existingAccount.account_name}</h3>
              <p className="text-slate-600">{existingAccount.bank_name}</p>
              <p className="font-mono text-sm text-slate-500 mt-1">•••• {existingAccount.account_number.slice(-4)}</p>
            </div>
          </div>

          {!isReady && (
            <div className="bg-amber-50 text-amber-800 p-4 rounded-lg text-sm border border-amber-200">
              <p className="font-bold mb-1">Marketplace Payouts Pending</p>
              <p className="mb-4">Your bank details are saved, but the marketplace payout automation is awaiting platform upgrade (Starter Business limitation). Your funds will accumulate securely in the ledger in the meantime.</p>
              <Button 
                variant="outline" 
                className="bg-white border-amber-300 text-amber-900 hover:bg-amber-100"
                onClick={async () => {
                  if (confirm("Re-attempt Paystack Subaccount creation?")) {
                    handleConfirm();
                  }
                }}
                disabled={verifying}
              >
                {verifying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Retry Paystack Connection
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (success) {
    return (
      <Card className="border-emerald-200 shadow-sm max-w-2xl bg-emerald-50 text-center py-12">
        <CardContent>
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-emerald-900 mb-2">Account Verified Successfully!</h2>
          <p className="text-emerald-700">Redirecting to your payout dashboard...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 shadow-sm max-w-2xl">
      <CardHeader>
        <CardTitle>Link Payout Account</CardTitle>
        <CardDescription>Connect your bank account securely via Paystack to receive automated marketplace settlements.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {error && (
          <div className="p-4 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4"/> {error}
          </div>
        )}

        {!resolvedAccount ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Bank</Label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={bankCode}
                onChange={e => setBankCode(e.target.value)}
              >
                <option value="">Select your bank...</option>
                {commonBanks.map(b => (
                  <option key={b.code} value={b.code}>{b.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Account Number</Label>
              <Input 
                placeholder="0123456789" 
                value={accountNumber}
                onChange={e => setAccountNumber(e.target.value)}
                maxLength={10}
              />
            </div>
            <Button onClick={handleResolve} disabled={loading} className="w-full">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Verify Account
            </Button>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-100 text-center">
              <p className="text-sm text-blue-600 font-medium uppercase tracking-wide mb-2">Resolved Account Name</p>
              <h3 className="text-2xl font-black text-slate-900">{resolvedAccount.account_name}</h3>
              <p className="text-slate-500 mt-2">Please confirm this matches your business registration.</p>
            </div>
            
            <div className="flex gap-4">
              <Button variant="outline" className="w-full" onClick={() => setResolvedAccount(null)} disabled={verifying}>
                Back
              </Button>
              <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleConfirm} disabled={verifying}>
                {verifying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Confirm & Connect
              </Button>
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  );
}
