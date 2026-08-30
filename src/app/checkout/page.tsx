"use client";

import { useCartStore } from "@/store/cartStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, ShieldCheck, Truck, Lock, CreditCard, CheckCircle2, Plus } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function CheckoutPage() {
  const { items, getTotalPrice, clearCart } = useCartStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [userAddresses, setUserAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | "new">("new");
  const [useSavedAddress, setUseSavedAddress] = useState(false);
  const [savedAddress, setSavedAddress] = useState<any>(null);

  const [formData, setFormData] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    address: "", state: "", city: ""
  });

  const [step, setStep] = useState<"address" | "payment">("address");
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    setMounted(true);
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id);
        
        supabase.from("profiles").select("*").eq("id", data.user.id).single().then(({ data: profile }) => {
          if (profile) {
            setFormData(prev => ({ 
              ...prev, 
              email: profile.email || data.user?.email || "",
              phone: profile.phone || "",
              firstName: profile.name ? profile.name.split(' ')[0] : "",
              lastName: profile.name ? profile.name.split(' ').slice(1).join(' ') : ""
            }));
          } else {
             setFormData(prev => ({ ...prev, email: data.user?.email || "" }));
          }
        });

        // Fetch user's address book from DB
        supabase.from("addresses").select("*").eq("user_id", data.user.id).order("is_default", { ascending: false }).order("created_at", { ascending: false }).then(({ data: addresses }) => {
          if (addresses && addresses.length > 0) {
            setUserAddresses(addresses);
            setSelectedAddressId(addresses[0].id);
            setSavedAddress({
              street: addresses[0].street,
              city: addresses[0].city,
              state: addresses[0].state
            });
            setUseSavedAddress(true);
          }
        });
        setCheckingAuth(false);
      } else {
        router.push("/login?redirect=/checkout");
      }
    });
  }, [supabase, router]);

  if (!mounted || checkingAuth) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-rose-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4 text-slate-900">Your cart is empty</h1>
        <Link href="/shop"><Button className="bg-rose-500 hover:bg-rose-600">Continue Shopping</Button></Link>
      </div>
    );
  }

  const subtotal = getTotalPrice();
  const shipping = 0;
  const total = subtotal + shipping;

  const handleContinueToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (userAddresses.length === 0 || !selectedAddressId || selectedAddressId === "new") {
      alert("Please select or add a delivery address.");
      return;
    }
    
    if (selectedAddressId !== "new") {
      const selected = userAddresses.find(a => a.id === selectedAddressId);
      if (selected) {
        setSavedAddress({
          street: selected.street,
          city: selected.city,
          state: selected.state
        });
        setUseSavedAddress(true);
      }
    } else {
      setUseSavedAddress(false);
    }
    setStep("payment");
  };

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const isNewAddress = selectedAddressId === "new";
      const selectedAddr = isNewAddress ? null : userAddresses.find(a => a.id === selectedAddressId);

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: formData.email, 
          userId: userId,
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          phone: isNewAddress ? formData.phone : (selectedAddr?.phone || formData.phone),
          address: isNewAddress ? {
            street: formData.address,
            city: formData.city,
            state: formData.state
          } : {
            street: selectedAddr.street,
            city: selectedAddr.city,
            state: selectedAddr.state
          },
          saveAddress: isNewAddress && userId ? true : false,
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
        
        {step === "address" ? (
          <div className="max-w-2xl mx-auto">
            <Card className="border-none shadow-sm">
              <CardHeader className="border-b bg-slate-50/50 pb-4">
                <CardTitle className="text-lg flex items-center gap-2"><Truck className="w-5 h-5 text-orange-500" /> Delivery Information</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleContinueToPayment} className="space-y-6">
                  
                  {userAddresses.length > 0 && (
                    <div className="grid gap-4 sm:grid-cols-2 mb-6">
                      {userAddresses.map(addr => (
                        <div 
                          key={addr.id}
                          onClick={() => setSelectedAddressId(addr.id)}
                          className={`border p-4 rounded-lg cursor-pointer transition-all ${selectedAddressId === addr.id ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-slate-200 hover:border-blue-300'}`}
                        >
                           <div className="flex justify-between items-start">
                             <p className="font-bold text-slate-900">{addr.label || 'Delivery Address'}</p>
                             {selectedAddressId === addr.id && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
                           </div>
                           <p className="text-sm text-slate-600 mt-2">{addr.street}</p>
                           <p className="text-sm text-slate-600">{addr.city}, {addr.state}</p>
                           <p className="text-sm text-slate-600 mt-1">{addr.phone}</p>
                        </div>
                      ))}
                      
                      
                    </div>
                  )}

                  
                  {userAddresses.length === 0 && (
                    <div className="bg-amber-50 border border-amber-200 p-6 rounded-lg text-center mb-6">
                      <p className="text-amber-800 font-medium mb-4">You don't have any saved delivery addresses.</p>
                      <Link href="/account/address">
                        <Button type="button" className="bg-amber-600 hover:bg-amber-700 text-white">
                          Add an Address
                        </Button>
                      </Link>
                    </div>
                  )}

{userAddresses.length > 0 && (
                      <Button type="submit" className="w-full h-12 text-md font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-md mt-4">
                        Continue to Payment <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    )}
                </form>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left: Summary Info */}
            <div className="flex-1 space-y-6">
              
              <Card className="border-none shadow-sm">
                <CardHeader className="border-b bg-slate-50/50 pb-4 flex flex-row items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2"><Truck className="w-5 h-5 text-emerald-600" /> Delivery Address</CardTitle>
                  <button onClick={() => setStep("address")} className="text-sm font-bold text-blue-600 hover:underline">Edit</button>
                </CardHeader>
                <CardContent className="pt-6">
                  {useSavedAddress && savedAddress ? (
                    <div className="flex items-start gap-3 p-4 border rounded-lg bg-blue-50/50 border-blue-100">
                      <div className="mt-1"><ShieldCheck className="w-5 h-5 text-blue-600" /></div>
                      <div>
                        <p className="font-bold text-slate-900">Delivering to your default address</p>
                        <p className="text-sm text-slate-600 mt-1">{savedAddress.street}, {savedAddress.city}, {savedAddress.state}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 border rounded-lg bg-slate-50">
                      <p className="font-bold text-slate-900">{formData.firstName} {formData.lastName}</p>
                      <p className="text-sm text-slate-600 mt-1">{formData.address}</p>
                      <p className="text-sm text-slate-600">{formData.city}, {formData.state}</p>
                      <p className="text-sm text-slate-600 mt-1">{formData.phone} | {formData.email}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardHeader className="border-b bg-slate-50/50 pb-4">
                  <CardTitle className="text-lg flex items-center gap-2"><CreditCard className="w-5 h-5 text-orange-500" /> Secure Payment</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="border border-emerald-200 bg-emerald-50 rounded-lg p-4 flex items-start gap-4">
                    <div className="mt-1"><ShieldCheck className="w-6 h-6 text-emerald-600" /></div>
                    <div>
                      <h4 className="font-bold text-slate-900">Paystack Secure Checkout</h4>
                      <p className="text-sm text-slate-600 mt-1">When you click Confirm & Pay Now, you will be securely redirected to Paystack to complete your payment using Card, Bank Transfer, USSD, or Mobile Money.</p>
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
                
                <div className="space-y-6 max-h-[350px] overflow-y-auto pr-2 no-scrollbar">
                  {Object.entries(
                    items.reduce((acc: any, item: any) => {
                      const store = item.storeName || "ICON Official";
                      if (!acc[store]) acc[store] = [];
                      acc[store].push(item);
                      return acc;
                    }, {})
                  ).map(([storeName, storeItems]: [string, any]) => (
                    <div key={storeName} className="space-y-3">
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b pb-1">
                        Sold by {storeName}
                      </h3>
                      {storeItems.map((item: any) => (
                        <div key={`${item.id}-${item.width}-${item.height}-${item.motorType}`} className="flex gap-4">
                          <div className="w-16 h-16 bg-slate-100 rounded border shrink-0 overflow-hidden">
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm text-slate-900 truncate">{item.name}</h4>
                            <div className="flex justify-between mt-2 items-center">
                              <span className="text-xs font-bold text-slate-700">Qty: {item.quantity}</span>
                              <span className="text-sm font-bold text-slate-900">₦{(item.price * item.quantity).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      ))}
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
                  onClick={handleCheckout}
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
        )}
      </div>
    </div>
  );
}

