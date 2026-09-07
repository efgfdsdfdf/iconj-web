import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Request Received | ICONJ",
};

export default async function QuoteConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string; token?: string; id?: string }>;
}) {
  const { reference, token, id } = await searchParams;

  return (
    <div className="container mx-auto px-4 py-16 max-w-2xl text-center">
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8" />
        </div>
      </div>
      
      <h1 className="text-3xl font-bold text-slate-900 mb-4">Request Received</h1>
      <p className="text-lg text-slate-600 mb-8">
        Thank you for your quotation request. Our team will review your requirements with our suppliers and get back to you shortly.
      </p>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Your Reference Number
          </p>
          <p className="text-3xl font-bold text-blue-600">
            {reference || "ICONJ-Q-XXXX"}
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {id && token && (
          <Button asChild size="lg" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
            <Link href={`/account/quotations/${id}?token=${token}`}>
              Track Your Request <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        )}
        {!token && (
          <Button asChild size="lg" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
            <Link href="/account/quotations">
              View Your Quotations <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        )}
        <div className="mt-4">
          <Link href="/shop" className="text-slate-500 hover:text-slate-800 font-medium">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
