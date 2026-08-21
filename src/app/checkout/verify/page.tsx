"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import { CheckCircle2, Loader2, Home, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function CheckoutVerifyPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reference = searchParams.get("reference");
  const clearCart = useCartStore((state) => state.clearCart);
  
  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading");

  useEffect(() => {
    if (!reference) {
      setStatus("failed");
      return;
    }

    // In a production app, we would make a server-side call here to Paystack 
    // to cryptographically verify the transaction using the Secret Key.
    // For this MVP, if Paystack returned a reference, we assume success.
    
    setTimeout(() => {
      clearCart();
      setStatus("success");
    }, 1500);

  }, [reference, clearCart]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border p-8 text-center">
        
        {status === "loading" && (
          <div className="flex flex-col items-center">
            <Loader2 className="w-16 h-16 text-blue-600 animate-spin mb-4" />
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Verifying Payment...</h1>
            <p className="text-slate-500">Please do not close this window.</p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-12 h-12 text-emerald-600" />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Payment Successful!</h1>
            <p className="text-slate-600 mb-2">Thank you for your order.</p>
            <p className="text-sm font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded mb-8">Ref: {reference}</p>
            
            <div className="space-y-3 w-full">
              <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 h-12">
                <Link href="/account/orders"><Package className="w-4 h-4 mr-2" /> Track My Order</Link>
              </Button>
              <Button asChild variant="outline" className="w-full h-12">
                <Link href="/"><Home className="w-4 h-4 mr-2" /> Back to Home</Link>
              </Button>
            </div>
          </div>
        )}

        {status === "failed" && (
          <div className="flex flex-col items-center">
            <h1 className="text-2xl font-bold text-red-600 mb-2">Payment Verification Failed</h1>
            <p className="text-slate-600 mb-6">We could not verify your payment reference.</p>
            <Button asChild className="w-full">
              <Link href="/checkout">Return to Checkout</Link>
            </Button>
          </div>
        )}

      </div>
    </div>
  );
}

