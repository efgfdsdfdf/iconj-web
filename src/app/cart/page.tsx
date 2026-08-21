"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useCartStore } from "@/store/cartStore";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { items, removeItem, updateQuantity, getTotalPrice } = useCartStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Your Cart</h1>

      {items.length === 0 ? (
        <div className="text-center py-24 bg-slate-50 rounded-lg border border-dashed">
          <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
          <p className="text-slate-500 mb-6">Looks like you haven&apos;t added any window solutions yet.</p>
          <Link href="/shop">
            <Button className="bg-blue-600 hover:bg-blue-700">Start Shopping</Button>
          </Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-6">
            {items.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <CardContent className="p-0 flex flex-col sm:flex-row">
                  <div className="w-full sm:w-48 h-48 bg-slate-100 shrink-0 border-r">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h3 className="font-bold text-lg text-slate-900 mb-1">{item.name}</h3>
                        {item.configuration && (
                          <div className="text-sm text-slate-500 space-y-0.5">
                            <p>Size: {item.configuration.width}x{item.configuration.height} cm</p>
                            <p>Motor: {item.configuration.motor}</p>
                            <p>Fabric: {item.configuration.fabric}</p>
                          </div>
                        )}
                      </div>
                      <p className="font-bold text-lg text-slate-900 whitespace-nowrap">₦{(item.price * item.quantity).toLocaleString()}</p>
                    </div>

                    <div className="flex items-center justify-between mt-6 pt-4 border-t">
                      <div className="flex items-center border rounded-md">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="px-3 py-1 hover:bg-slate-100 text-slate-600 transition-colors">-</button>
                        <span className="px-4 py-1 border-l border-r text-sm font-medium">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="px-3 py-1 hover:bg-slate-100 text-slate-600 transition-colors">+</button>
                      </div>
                      <button onClick={() => removeItem(item.id)} className="text-sm font-medium text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors">
                        <Trash2 className="w-4 h-4" /> Remove
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 border-slate-200 shadow-sm">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Order Summary</h3>
                <div className="space-y-3 text-sm text-slate-600 pb-4 border-b">
                  <div className="flex justify-between">
                    <span>Subtotal ({items.reduce((acc, i) => acc + i.quantity, 0)} items)</span>
                    <span className="font-medium text-slate-900">₦{getTotalPrice().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className="text-amber-600 font-medium">Calculated at checkout</span>
                  </div>
                </div>
                <div className="flex justify-between items-center py-4 text-lg font-bold text-slate-900">
                  <span>Total</span>
                  <span>₦{getTotalPrice().toLocaleString()}</span>
                </div>
                
                <Button onClick={() => router.push("/checkout")} size="lg" className="w-full bg-blue-600 hover:bg-blue-700 mb-4 group">
                  Proceed to Checkout <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>

                <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  Secure Checkout Process
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
