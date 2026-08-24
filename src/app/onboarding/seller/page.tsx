"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, Building2, MapPin, Wallet, FileText, UploadCloud, AlertCircle } from "lucide-react";

export default function SellerOnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Check Auth before allowing them to fill out the form
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Not logged in -> send to login page
        router.push("/login");
      } else {
        setIsAuthChecking(false);
      }
    };
    checkUser();
  }, [supabase, router]);

  // Comprehensive Form State
  const [formData, setFormData] = useState({
    // Step 1: Business
    businessName: "",
    storeName: "",
    businessType: "retail",
    // Step 2: Contact
    phone: "",
    street: "",
    city: "",
    state: "",
    // Step 3: Financials
    bankName: "",
    accountNumber: "",
    accountName: "",
    // Step 4: Documents (Simulated file names for this iteration)
    taxId: "",
    cacDocumentName: "",
    idDocumentName: "",
    agreedToTerms: false
  });

  const updateForm = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleNext = () => {
    setError(null);
    // Basic validation per step
    if (step === 1 && (!formData.businessName || !formData.storeName)) {
      setError("Please fill out all required business details.");
      return;
    }
    if (step === 2 && (!formData.phone || !formData.street || !formData.city || !formData.state)) {
      setError("Please fill out all required contact details.");
      return;
    }
    if (step === 3 && (!formData.bankName || !formData.accountNumber || !formData.accountName)) {
      setError("Please fill out all required financial details.");
      return;
    }
    
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setError(null);
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step !== 4) return;
    
    if (!formData.cacDocumentName || !formData.idDocumentName) {
      setError("Please upload all required KYC documents.");
      return;
    }

    if (!formData.agreedToTerms) {
      setError("You must agree to the Terms and Conditions to proceed.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/onboarding/seller", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to submit seller application");
      }

      // Redirect to seller dashboard directly!
      router.push("/seller");
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to submit seller application");
    } finally {
      setLoading(false);
    }
  };

  // UI Helpers
  const steps = [
    { id: 1, title: "Business Info", icon: Building2 },
    { id: 2, title: "Contact", icon: MapPin },
    { id: 3, title: "Financials", icon: Wallet },
    { id: 4, title: "KYC Docs", icon: FileText },
  ];

  if (isAuthChecking) {
    return (
      <div className="container flex min-h-[calc(100vh-100px)] w-full items-center justify-center py-12 bg-slate-50">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="container flex min-h-[calc(100vh-100px)] w-full flex-col items-center justify-center py-12 bg-slate-50">
      
      {/* Progress Tracker */}
      <div className="w-full max-w-[800px] mb-8">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 z-0 rounded-full"></div>
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-600 z-0 transition-all duration-300 rounded-full" 
            style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
          ></div>
          
          {steps.map((s) => (
            <div key={s.id} className="relative z-10 flex flex-col items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${
                step > s.id ? 'bg-blue-600 border-blue-600 text-white' : 
                step === s.id ? 'bg-white border-blue-600 text-blue-600 shadow-sm' : 
                'bg-white border-slate-300 text-slate-400'
              }`}>
                {step > s.id ? <CheckCircle2 className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
              </div>
              <span className={`text-xs font-bold uppercase tracking-wider ${step >= s.id ? 'text-slate-800' : 'text-slate-400'}`}>
                {s.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      <Card className="w-full max-w-[800px] shadow-lg border-none">
        <CardHeader className="border-b bg-white rounded-t-xl pb-6">
          <CardTitle className="text-2xl text-slate-900">Seller Application</CardTitle>
          <CardDescription className="text-slate-500">
            {step === 1 && "Let's start with your core business identity."}
            {step === 2 && "Where do you operate from? We need this for logistics and traceability."}
            {step === 3 && "How will you receive your payouts from sales?"}
            {step === 4 && "Upload legal documentation to verify your business identity."}
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="p-6 min-h-[350px]">
            {error && <div className="p-4 mb-6 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2"><AlertCircle className="w-4 h-4"/> {error}</div>}
            
            {/* STEP 1: BUSINESS INFO */}
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Legal Business Name *</Label>
                  <Input id="businessName" placeholder="e.g. Acme Retail Ltd" value={formData.businessName} onChange={e => updateForm({ businessName: e.target.value })} />
                  <p className="text-xs text-slate-500">Must match your official registration documents.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="storeName">Public Store Name *</Label>
                  <Input id="storeName" placeholder="e.g. Acme Gadgets" value={formData.storeName} onChange={e => updateForm({ storeName: e.target.value })} />
                  <p className="text-xs text-slate-500">This is the brand name customers will see on ICONJ.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessType">Business Category *</Label>
                  <select 
                    id="businessType" 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={formData.businessType} 
                    onChange={e => updateForm({ businessType: e.target.value })}
                  >
                    <option value="retail">Retail (B2C)</option>
                    <option value="wholesale">Wholesale / Distributor (B2B)</option>
                    <option value="manufacturer">Manufacturer</option>
                  </select>
                </div>
              </div>
            )}

            {/* STEP 2: CONTACT & LOCATION */}
            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-2">
                  <Label htmlFor="phone">Official Phone Number *</Label>
                  <Input id="phone" type="tel" placeholder="e.g. +234 800 000 0000" value={formData.phone} onChange={e => updateForm({ phone: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="street">Street Address *</Label>
                  <Input id="street" placeholder="e.g. 123 Commerce Avenue" value={formData.street} onChange={e => updateForm({ street: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City / LGA *</Label>
                    <Input id="city" placeholder="e.g. Ikeja" value={formData.city} onChange={e => updateForm({ city: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State *</Label>
                    <Input id="state" placeholder="e.g. Lagos" value={formData.state} onChange={e => updateForm({ state: e.target.value })} />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: FINANCIALS */}
            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
                  <p className="text-sm text-blue-800">Please provide a valid Nigerian bank account. We will deposit your sales earnings directly into this account after taking our commission.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name *</Label>
                  <Input id="bankName" placeholder="e.g. Guaranty Trust Bank" value={formData.bankName} onChange={e => updateForm({ bankName: e.target.value })} />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="accountNumber">Account Number (NUBAN) *</Label>
                    <Input id="accountNumber" maxLength={10} placeholder="0123456789" value={formData.accountNumber} onChange={e => updateForm({ accountNumber: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountName">Account Name *</Label>
                    <Input id="accountName" placeholder="e.g. Acme Retail Ltd" value={formData.accountName} onChange={e => updateForm({ accountName: e.target.value })} />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: KYC & DOCUMENTS */}
            {step === 4 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-2">
                  <Label htmlFor="taxId">Tax Identification Number (TIN) / BVN</Label>
                  <Input id="taxId" placeholder="Optional but recommended for faster approval" value={formData.taxId} onChange={e => updateForm({ taxId: e.target.value })} />
                </div>
                
                <div className="space-y-4 pt-4 border-t">
                  <div>
                    <Label className="mb-2 block">1. Business Registration Certificate (CAC) *</Label>
                    <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 flex flex-col items-center justify-center text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative">
                      <input 
                        type="file" 
                        accept=".pdf,.jpg,.jpeg,.png" 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if(file) updateForm({ cacDocumentName: file.name });
                        }}
                      />
                      <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
                      {formData.cacDocumentName ? (
                        <p className="text-sm font-bold text-emerald-600">{formData.cacDocumentName}</p>
                      ) : (
                        <>
                          <p className="text-sm font-medium text-slate-700">Click to upload or drag and drop</p>
                          <p className="text-xs text-slate-500 mt-1">PDF, JPG or PNG (max. 5MB)</p>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label className="mb-2 block">2. Valid Government ID (Owner/Director) *</Label>
                    <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 flex flex-col items-center justify-center text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative">
                      <input 
                        type="file" 
                        accept=".pdf,.jpg,.jpeg,.png" 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if(file) updateForm({ idDocumentName: file.name });
                        }}
                      />
                      <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
                      {formData.idDocumentName ? (
                        <p className="text-sm font-bold text-emerald-600">{formData.idDocumentName}</p>
                      ) : (
                        <>
                          <p className="text-sm font-medium text-slate-700">Click to upload or drag and drop</p>
                          <p className="text-xs text-slate-500 mt-1">Passport, Driver's License, NIN (max. 5MB)</p>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t flex items-start gap-3 mt-4">
                    <input 
                      type="checkbox" 
                      id="terms" 
                      className="w-5 h-5 rounded border-slate-300 text-blue-600 mt-0.5" 
                      checked={formData.agreedToTerms}
                      onChange={(e) => updateForm({ agreedToTerms: e.target.checked })}
                    />
                    <Label htmlFor="terms" className="text-sm text-slate-700 leading-tight">
                      I have read and agree to the <a href="/terms-and-conditions" target="_blank" className="text-blue-600 hover:underline">Terms & Conditions</a>, including the marketplace commission structure, custom measurement liability, and payout schedule.
                    </Label>
                  </div>
                </div>
              </div>
            )}

          </CardContent>
          <CardFooter className="bg-slate-50 border-t p-6 rounded-b-xl flex justify-between">
            {step > 1 ? (
              <Button type="button" variant="outline" onClick={handleBack} disabled={loading}>
                Back
              </Button>
            ) : (
              <div></div> // Spacer
            )}
            
            {step < 4 ? (
              <Button type="button" onClick={handleNext} className="bg-blue-600 hover:bg-blue-700">
                Continue to Next Step
              </Button>
            ) : (
              <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[150px]">
                {loading ? "Submitting..." : "Submit Application"}
              </Button>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
