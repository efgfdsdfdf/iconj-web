import { Button } from "@/components/ui/button";
import { CheckCircle2, ShoppingBag } from "lucide-react";
import Link from "next/link";

export default function WelcomePage() {
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
          <Link href="/account" className="w-full">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">Go to My Dashboard</Button>
          </Link>
          <Link href="/shop" className="w-full">
            <Button variant="outline" className="w-full">
              <ShoppingBag className="w-4 h-4 mr-2" /> Start Shopping
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
