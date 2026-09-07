"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle2, Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface QuoteFormClientProps {
  initialProfile: { name?: string; email?: string; phone?: string } | null;
}

export default function QuoteFormClient({ initialProfile }: QuoteFormClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Step state
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  // Form State
  const [productId, setProductId] = useState(searchParams?.get("product_id") || "");
  const [productName, setProductName] = useState(searchParams?.get("product_name") || "");
  
  // Category-based dynamic fields
  const [category, setCategory] = useState<"blinds" | "accessories">("blinds");
  
  // Specs
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [colour, setColour] = useState("");
  const [design, setDesign] = useState("");
  const [motorized, setMotorized] = useState("no");
  const [quantity, setQuantity] = useState("1");
  const [logo, setLogo] = useState("");
  const [customization, setCustomization] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");

  // Contact
  const [name, setName] = useState(initialProfile?.name || "");
  const [email, setEmail] = useState(initialProfile?.email || "");
  const [phone, setPhone] = useState(initialProfile?.phone || "");
  
  // Delivery
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Basic heuristics: if it has 'track' or 'motor' or 'accessory', maybe it's not a blind
    if (productName.toLowerCase().includes("track") || productName.toLowerCase().includes("accessory")) {
      setCategory("accessories");
    }
  }, [productName]);

  const handleNext = () => {
    setError(null);
    if (step === 1) {
      if (!productName.trim()) {
        setError("Please provide a product name.");
        return;
      }
    }
    if (step === 2) {
      if (category === "blinds" && (!width || !height)) {
        setError("Please provide approximate width and height.");
        return;
      }
    }
    setStep((s) => Math.min(s + 1, totalSteps));
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim() || !phone.trim()) {
      setError("Please fill in all contact details.");
      return;
    }
    if (!state.trim()) {
      setError("Please provide your delivery state.");
      return;
    }

    setLoading(true);

    const specs: Record<string, any> = {};
    if (category === "blinds") {
      if (width) specs.width = width;
      if (height) specs.height = height;
      if (motorized === "yes") specs.motorized = true;
      if (motorized === "no") specs.motorized = false;
    }
    if (colour) specs.colour = colour;
    if (design) specs.design = design;
    if (logo) specs.logo = logo;
    if (customization) specs.customization = customization;

    const payload = {
      product_id: productId || null,
      product_name: productName,
      quantity: parseInt(quantity) || 1,
      specifications: specs,
      delivery_location: {
        address,
        city,
        state,
        country: "Nigeria"
      },
      customer_notes: customerNotes,
      customer_name: name,
      customer_email: email,
      customer_phone: phone
    };

    try {
      const res = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit request");
      }

      // Redirect to confirmation page with the token (for guest access)
      router.push(`/quote/confirmation?reference=${data.quotation.reference}&token=${data.quotation.access_token}&id=${data.quotation.id}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Request a Custom Quote</h1>
        <p className="text-slate-500">Provide your specifications and we'll calculate the exact cost.</p>
      </div>

      <div className="flex items-center justify-center mb-8">
        {[1, 2, 3].map((num) => (
          <div key={num} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
              step >= num ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-500"
            }`}>
              {num}
            </div>
            {num < 3 && (
              <div className={`w-16 h-1 mx-2 ${step > num ? "bg-blue-600" : "bg-slate-200"}`} />
            )}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {step === 1 && "Product Information"}
            {step === 2 && "Specifications"}
            {step === 3 && "Contact & Delivery"}
          </CardTitle>
          <CardDescription>
            {step === 1 && "What product would you like to quote?"}
            {step === 2 && "Tell us your exact measurements and requirements."}
            {step === 3 && "Where should we send the quote and deliver the product?"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md flex items-start">
                <AlertCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {/* STEP 1 */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Product Type/Name *</Label>
                  <Input 
                    placeholder="e.g. Zebra Blinds, Curtains, Motorized Track..." 
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={(val: any) => setCategory(val)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blinds">Blinds / Curtains</SelectItem>
                      <SelectItem value="accessories">Accessories / Components</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Quantity *</Label>
                  <Input 
                    type="number" 
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <div className="space-y-6">
                {category === "blinds" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Width (cm) *</Label>
                      <Input 
                        placeholder="e.g. 150" 
                        value={width}
                        onChange={(e) => setWidth(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Height (cm) *</Label>
                      <Input 
                        placeholder="e.g. 200" 
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Colour Preference</Label>
                    <Input 
                      placeholder="e.g. White, Grey, Wood" 
                      value={colour}
                      onChange={(e) => setColour(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Design / Pattern</Label>
                    <Input 
                      placeholder="e.g. Plain, Textured" 
                      value={design}
                      onChange={(e) => setDesign(e.target.value)}
                    />
                  </div>
                </div>
                
                {category === "blinds" && (
                  <div className="space-y-2">
                    <Label>Motorization</Label>
                    <Select value={motorized} onValueChange={(val) => setMotorized(val)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no">Manual / Standard</SelectItem>
                        <SelectItem value="yes">Motorized (Smart/Remote)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Custom Logo / Branding Requirements</Label>
                  <Input 
                    placeholder="Any logo printing needed?" 
                    value={logo}
                    onChange={(e) => setLogo(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Additional Notes</Label>
                  <Textarea 
                    placeholder="Any specific fabric requests, customization, or context for this order..." 
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="space-y-4 border-b pb-6">
                  <h3 className="font-semibold text-lg">Your Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Full Name *</Label>
                      <Input 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email Address *</Label>
                      <Input 
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number *</Label>
                    <Input 
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Delivery Location</h3>
                  <p className="text-sm text-slate-500">We need this to accurately calculate your shipping cost.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>State *</Label>
                      <Input 
                        placeholder="e.g. Lagos"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>City</Label>
                      <Input 
                        placeholder="e.g. Ikeja"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Street Address</Label>
                    <Input 
                      placeholder="Optional, but helps with accuracy"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between mt-8 pt-6 border-t">
              {step > 1 ? (
                <Button type="button" variant="outline" onClick={handleBack} disabled={loading}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
              ) : (
                <div /> // spacer
              )}
              
              {step < totalSteps ? (
                <Button type="button" onClick={handleNext}>
                  Next <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...
                    </>
                  ) : (
                    <>
                      Submit Request <CheckCircle2 className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
