"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle2, ShoppingBag, Store, Briefcase } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function WelcomePage() {
  const [intent, setIntent] = useState<string>("retail");
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function getUserIntent() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.user_metadata?.intent) {
        setIntent(session.user.user_metadata.intent);
      }
      setLoading(false);
    }
    getUserIntent();
  }, [supabase.auth]);

  if (loading) {
    return <div className="container flex min-h-[calc(100vh-100px)] items-center justify-center">Loading...</div>;
  }

  return (
    <div className="container flex min-h-[calc(100vh-100px)] w-full flex-col items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border text-center space-y-6">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        
        <h1 className="text-3xl font-bold text-slate-900">Successfully Confirmed!</h1>
        
        <p className="text-slate-600 text-lg">
          Your email has been successfully verified. Welcome to the ICONJ family!
        </p>

        <div className="pt-6 border-t mt-6 flex flex-col gap-3">
          {intent === "retail" && (
            <>
              <Link href="/shop" className="w-full">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  <ShoppingBag className="w-4 h-4 mr-2" /> Start Shopping
                </Button>
              </Link>
              <Link href="/account" className="w-full">
                <Button variant="outline" className="w-full">Go to My Dashboard</Button>
              </Link>
            </>
          )}

          {intent === "wholesale" && (
            <>
              <p className="text-sm text-slate-500 mb-2">Next step: Complete your business profile for wholesale access.</p>
              <Link href="/onboarding/wholesale" className="w-full">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  <Briefcase className="w-4 h-4 mr-2" /> Setup Business Profile
                </Button>
              </Link>
            </>
          )}

          {intent === "seller" && (
            <>
              <p className="text-sm text-slate-500 mb-2">Next step: Complete your seller application.</p>
              <Link href="/onboarding/seller" className="w-full">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  <Store className="w-4 h-4 mr-2" /> Start Seller Application
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
