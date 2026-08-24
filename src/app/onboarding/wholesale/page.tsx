"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export default function WholesaleOnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    businessName: "",
    registrationNumber: "",
    taxId: "",
    address: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) throw new Error("No active session");

      // Insert into businesses
      const { error: dbError } = await supabase.from('businesses').insert({
        owner_id: session.user.id,
        business_name: formData.businessName,
        registration_number: formData.registrationNumber,
        tax_id: formData.taxId,
        business_type: 'wholesale',
        address: { street: formData.address } // Simplified for now
      });

      if (dbError) throw dbError;

      // Update user_roles
      await supabase.from('user_roles').insert({
        user_id: session.user.id,
        role: 'wholesale'
      });

      // Redirect to account dashboard
      router.push("/account");
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to submit business profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container flex min-h-[calc(100vh-100px)] w-full flex-col items-center justify-center py-12">
      <Card className="w-full max-w-[500px]">
        <CardHeader>
          <CardTitle>Wholesale Business Profile</CardTitle>
          <CardDescription>Enter your business details to access wholesale pricing.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">{error}</div>}
            
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name *</Label>
              <Input id="businessName" required value={formData.businessName} onChange={e => setFormData({...formData, businessName: e.target.value})} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="registrationNumber">Registration Number (CAC) *</Label>
              <Input id="registrationNumber" required value={formData.registrationNumber} onChange={e => setFormData({...formData, registrationNumber: e.target.value})} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxId">Tax ID (TIN)</Label>
              <Input id="taxId" value={formData.taxId} onChange={e => setFormData({...formData, taxId: e.target.value})} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Business Address *</Label>
              <Input id="address" required value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Submitting..." : "Complete Profile"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
