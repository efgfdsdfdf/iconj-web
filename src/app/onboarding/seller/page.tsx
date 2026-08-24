"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export default function SellerOnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    businessName: "",
    storeName: "",
    bankName: "",
    accountNumber: "",
    accountName: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) throw new Error("No active session");

      // 1. Create Business
      const { data: businessData, error: businessError } = await supabase.from('businesses').insert({
        owner_id: session.user.id,
        business_name: formData.businessName,
        business_type: 'retail'
      }).select().single();

      if (businessError) throw businessError;

      // 2. Create Seller Record (Pending status by default)
      const { data: sellerData, error: sellerError } = await supabase.from('sellers').insert({
        profile_id: session.user.id,
        business_id: businessData.id,
        status: 'pending_verification'
      }).select().single();

      if (sellerError) throw sellerError;

      // 3. Create Store
      const storeSlug = formData.storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const { error: storeError } = await supabase.from('stores').insert({
        seller_id: sellerData.id,
        store_name: formData.storeName,
        slug: storeSlug
      });

      if (storeError) throw storeError;

      // 4. Add Payout Account
      const { error: payoutError } = await supabase.from('seller_payout_accounts').insert({
        seller_id: sellerData.id,
        bank_name: formData.bankName,
        account_number: formData.accountNumber,
        account_name: formData.accountName
      });

      if (payoutError) throw payoutError;

      // Update user_roles
      await supabase.from('user_roles').insert({
        user_id: session.user.id,
        role: 'seller'
      });

      // Redirect to seller dashboard pending page or account
      router.push("/account");
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to submit seller application");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container flex min-h-[calc(100vh-100px)] w-full flex-col items-center justify-center py-12">
      <Card className="w-full max-w-[600px]">
        <CardHeader>
          <CardTitle>Seller Application</CardTitle>
          <CardDescription>Apply to become a seller on ICON and reach thousands of customers.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {error && <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">{error}</div>}
            
            <div className="space-y-4">
              <h3 className="font-medium border-b pb-2">Business Details</h3>
              <div className="space-y-2">
                <Label htmlFor="businessName">Legal Business Name *</Label>
                <Input id="businessName" required value={formData.businessName} onChange={e => setFormData({...formData, businessName: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="storeName">Store Name (Public facing) *</Label>
                <Input id="storeName" required value={formData.storeName} onChange={e => setFormData({...formData, storeName: e.target.value})} />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium border-b pb-2">Payout Details (Bank Account)</h3>
              <div className="space-y-2">
                <Label htmlFor="bankName">Bank Name *</Label>
                <Input id="bankName" required value={formData.bankName} onChange={e => setFormData({...formData, bankName: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number *</Label>
                  <Input id="accountNumber" required value={formData.accountNumber} onChange={e => setFormData({...formData, accountNumber: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountName">Account Name *</Label>
                  <Input id="accountName" required value={formData.accountName} onChange={e => setFormData({...formData, accountName: e.target.value})} />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Submitting Application..." : "Submit Application"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
