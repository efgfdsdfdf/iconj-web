"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PackageSearch, Truck, Package, CheckCircle2, ChevronRight, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<any>(null);

  const supabase = createClient();

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId) {
      setError("Please enter an Order ID.");
      return;
    }
    
    setLoading(true);
    setError(null);
    setOrder(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from("orders")
        .select(`*, items:order_items(*, product:products(name, images))`)
        .eq("id", orderId.trim())
        .single();
        
      if (fetchError || !data) {
        throw new Error("Order not found. Please check your Order ID.");
      }
      
      // Basic security check: if they provided an email, we could verify it against the profile or checkout email,
      // but for this MVP, if they have the exact UUID, we show them the status.
      setOrder(data);
    } catch (err: any) {
      setError(err.message || "Failed to find order.");
    } finally {
      setLoading(false);
    }
  };

  const statusList = [
    { id: "pending_payment", label: "Awaiting Payment" },
    { id: "processing", label: "Processing Order" },
    { id: "shipped", label: "In Transit" },
    { id: "delivered", label: "Delivered" }
  ];

  const currentStatusIndex = Math.max(
    0,
    statusList.findIndex(s => s.id === order?.order_status)
  );

  return (
    <div className="container flex min-h-[calc(100vh-200px)] flex-col items-center py-12 px-4">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4">
          <PackageSearch className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Track Your Order</h1>
        <p className="text-slate-500 max-w-md mx-auto">Enter your order ID below to check the real-time shipping status.</p>
      </div>

      {!order ? (
        <Card className="w-full max-w-[500px] shadow-lg">
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
            <CardDescription>You can find your Order ID in your confirmation email.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTrack} className="space-y-6">
              {error && <div className="p-3 bg-red-50 text-red-600 rounded text-sm">{error}</div>}
              <div className="space-y-2">
                <Label htmlFor="orderId">Order ID</Label>
                <Input 
                  id="orderId" 
                  value={orderId}
                  onChange={e => setOrderId(e.target.value)}
                  placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000" 
                  className="h-12" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address (Optional)</Label>
                <Input 
                  id="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  type="email" 
                  placeholder="Email used during checkout" 
                  className="h-12" 
                />
              </div>
              
              <Button disabled={loading} size="lg" className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg">
                {loading ? "Searching..." : "Track Order"}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="w-full max-w-4xl space-y-6">
          <Button variant="ghost" onClick={() => setOrder(null)} className="mb-4">
            <Search className="w-4 h-4 mr-2" /> Track Another Order
          </Button>

          <Card className="border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b pb-6 mb-6">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Order #{order.id.split("-")[0].toUpperCase()}</p>
                  <h3 className="font-bold text-xl text-slate-900">?{Number(order.total_amount).toLocaleString()}</h3>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500 mb-1">Date Placed</p>
                  <p className="font-semibold text-slate-900">{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Progress Tracker */}
              <div className="relative mb-12 mt-8">
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-100 -translate-y-1/2 z-0" />
                <div 
                  className="absolute top-1/2 left-0 h-1 bg-blue-600 -translate-y-1/2 z-0 transition-all duration-500" 
                  style={{ width: `${(currentStatusIndex / (statusList.length - 1)) * 100}%` }}
                />
                
                <div className="relative z-10 flex justify-between">
                  {statusList.map((step, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-3 bg-white px-2">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-sm transition-colors ${
                        idx <= currentStatusIndex ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"
                      }`}>
                        {idx === 0 ? <Package className="w-4 h-4" /> : 
                         idx === statusList.length - 1 ? <CheckCircle2 className="w-4 h-4" /> : 
                         <Truck className="w-4 h-4" />}
                      </div>
                      <span className={`text-xs md:text-sm font-semibold text-center ${idx <= currentStatusIndex ? "text-slate-900" : "text-slate-400"}`}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="font-bold text-slate-900 mb-4">Order Items</h4>
                <div className="space-y-4">
                  {order.items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex gap-4 p-4 border rounded-lg bg-slate-50/50">
                      <div className="w-16 h-16 bg-white rounded overflow-hidden shadow-sm">
                        {item.product?.images?.[0] ? (
                          <img src={item.product.images[0]} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300"><Package className="w-6 h-6"/></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-sm text-slate-900">{item.product?.name || "Premium Blinds"}</p>
                        <p className="text-xs text-slate-500 mt-1">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm text-slate-900">?{Number(item.unit_price * item.quantity).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

