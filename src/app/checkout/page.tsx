"use client";

import { useCartStore } from "@/store/cartStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, ShieldCheck, Truck, Lock, CreditCard } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function CheckoutPage() {
  const { items, getTotalPrice, clearCart } = useCartStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const supabase = createClient();
  const [userEmail, setUserEmail] = useState("");

  const [formData, setFormData] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    address: "", state: "", city: ""
  });

  useEffect(() => {
    setMounted(true);
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserEmail(data.user.email || "");
        setFormData(prev => ({ ...prev, email: data.user?.email || "" }));
      }
    });
  }, [supabase]);

  if (!mounted) return null;

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 bg-slate-50">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Your Cart is Empty</h1>
        <p className="text-slate-500 mb-6">Browse our shop to find the perfect window coverings.</p>
        <Link href="/shop"><Button className="bg-orange-500 hover:bg-orange-600 font-bold uppercase tracking-wider">Continue Shopping</Button></Link>
      </div>
    );
  }

  const subtotal = getTotalPrice();
  const shipping = 0; // Free shipping
  const total = subtotal + shipping;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: formData.email, 
          name: `${formData.firstName} ${formData.lastName}`,
          phone: formData.phone,
          address: {
            street: formData.address,
            city: formData.city,
            state: formData.state
          },
          items: items 
        }),
      });

      const data = await response.json();
      
      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        alert("Payment initialization failed: " + (data.error || "Unknown error"));
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-12">
      {/* Secure Checkout Header */}
      <div className="bg-white border-b shadow-sm mb-8 py-4">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <Link href="/" className="font-extrabold text-2xl tracking-tight text-slate-900">ICONJ</Link>
          <div className="flex items-center gap-2 text-emerald-600 font-medium text-sm">
            <Lock className="w-4 h-4" /> Secure Checkout
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left: Checkout Form */}
          <div className="flex-1 space-y-6">
            <Card className="border-none shadow-sm">
              <CardHeader className="border-b bg-slate-50/50 pb-4">
                <CardTitle className="text-lg flex items-center gap-2"><Truck className="w-5 h-5 text-orange-500" /> 1. Delivery Information</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <form id="checkout-form" onSubmit={handleCheckout} className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>First Name</Label>
                      <Input required value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Last Name</Label>
                      <Input required value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Email Address</Label>
                      <Input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone Number</Label>
                      <Input type="tel" required placeholder="e.g. 08012345678" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Delivery Address</Label>
                    <Input required placeholder="Street address, apartment, suite, etc." value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>State</Label>
                      <select required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})}>
                        <option value="">Select State</option>
                        <option value="Lagos">Lagos</option>
                        <option value="Abuja">Abuja (FCT)</option>
                        <option value="Rivers">Rivers</option>
                        <option value="Oyo">Oyo</option>
                        <option value="Kano">Kano</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>City / L.G.A</Label>
                      <Input required value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader className="border-b bg-slate-50/50 pb-4">
                <CardTitle className="text-lg flex items-center gap-2"><CreditCard className="w-5 h-5 text-orange-500" /> 2. Payment Method</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="border border-emerald-200 bg-emerald-50 rounded-lg p-4 flex items-start gap-4">
                  <div className="mt-1"><ShieldCheck className="w-6 h-6 text-emerald-600" /></div>
                  <div>
                    <h4 className="font-bold text-slate-900">Paystack Secure Payment</h4>
                    <p className="text-sm text-slate-600 mt-1">You will be securely redirected to Paystack to complete your payment using Card, Bank Transfer, USSD, or Mobile Money.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Order Summary */}
          <div className="w-full lg:w-[400px] shrink-0">
            <Card className="border-none shadow-sm sticky top-24">
              <CardHeader className="border-b bg-slate-50/50 pb-4">
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                  {items.map((item) => (
                    <div key={`${item.id}-${item.width}-${item.height}-${item.motorType}`} className="flex gap-4">
                      <div className="w-16 h-16 bg-slate-100 rounded border shrink-0 overflow-hidden">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-slate-900 truncate">{item.name}</h4>
                        <p className="text-xs text-slate-500 truncate mt-0.5">Size: {item.width}</p>
                        <p className="text-xs text-slate-500 truncate">Motor: {item.motorType}</p>
                        <div className="flex justify-between mt-1 items-center">
                          <span className="text-xs font-bold text-slate-700">Qty: {item.quantity}</span>
                          <span className="text-sm font-bold text-slate-900">₦{(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 space-y-3 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span className="font-medium text-slate-900">₦{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Shipping Fee</span>
                    <span className="font-bold text-emerald-600 uppercase text-sm tracking-wider">Free</span>
                  </div>
                  <div className="flex justify-between text-slate-900 font-bold text-lg border-t pt-3">
                    <span>Total</span>
                    <span className="text-orange-600">₦{total.toLocaleString()}</span>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  form="checkout-form"
                  disabled={loading} 
                  className="w-full h-14 text-lg font-bold bg-orange-500 hover:bg-orange-600 shadow-xl shadow-orange-500/20 uppercase tracking-wider rounded-md"
                >
                  {loading ? "Initializing..." : "Confirm & Pay Now"}
                </Button>
                
                <div className="flex items-center justify-center gap-2 text-xs text-slate-400 font-medium">
                  <Lock className="w-3 h-3" /> Payments processed securely by Paystack
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}
