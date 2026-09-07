"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle2, XCircle, CreditCard, Loader2, AlertCircle, Calendar, Truck, Package } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Props {
  quotation: any;
  token?: string;
  paymentStatus?: string;
}

export default function QuotationDetailClient({ quotation, token, paymentStatus }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<"accept" | "decline" | "pay" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const authParam = token ? `?token=${token}` : "";

  const handleAccept = async () => {
    if (!confirm("Are you sure you want to accept this quotation? You will be directed to payment next.")) return;
    setLoading("accept");
    setError(null);
    try {
      const res = await fetch(`/api/quotations/${quotation.id}/accept${authParam}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(null);
    }
  };

  const handleDecline = async () => {
    if (!confirm("Are you sure you want to decline this quotation? This action cannot be undone.")) return;
    setLoading("decline");
    setError(null);
    try {
      const res = await fetch(`/api/quotations/${quotation.id}/decline${authParam}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(null);
    }
  };

  const handlePay = async () => {
    setLoading("pay");
    setError(null);
    try {
      const res = await fetch(`/api/quotations/${quotation.id}/initiate-payment${authParam}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      // Redirect to Paystack
      window.location.href = data.payment_url;
    } catch (err: any) {
      setError(err.message);
      setLoading(null);
    }
  };

  function getStatusColor(status: string) {
    switch(status) {
      case 'QUOTE_SENT':
      case 'QUOTE_VIEWED':
        return "bg-blue-100 text-blue-800 border-blue-200";
      case 'QUOTE_ACCEPTED':
        return "bg-amber-100 text-amber-800 border-amber-200";
      case 'PAID':
      case 'CONVERTED_TO_ORDER':
        return "bg-green-100 text-green-800 border-green-200";
      case 'QUOTE_DECLINED':
      case 'QUOTE_EXPIRED':
        return "bg-slate-100 text-slate-800 border-slate-200";
      default:
        return "bg-indigo-50 text-indigo-700 border-indigo-100";
    }
  }

  const isQuoteReady = ['QUOTE_SENT', 'QUOTE_VIEWED', 'QUOTE_ACCEPTED', 'PAYMENT_PENDING', 'PAID', 'CONVERTED_TO_ORDER'].includes(quotation.status);
  const canAcceptDecline = ['QUOTE_SENT', 'QUOTE_VIEWED'].includes(quotation.status);
  const canPay = quotation.status === 'QUOTE_ACCEPTED';
  const isPaid = ['PAID', 'CONVERTED_TO_ORDER'].includes(quotation.status);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
      <div className="flex items-center text-sm text-slate-500 hover:text-slate-900 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" />
        <Link href={token ? "/shop" : "/account/quotations"}>
          {token ? "Back to Shop" : "Back to Quotations"}
        </Link>
      </div>

      {paymentStatus === "done" && isPaid && (
        <Alert className="bg-green-50 border-green-200 text-green-800">
          <CheckCircle2 className="h-4 w-4 stroke-green-600" />
          <AlertTitle>Payment Successful!</AlertTitle>
          <AlertDescription>
            Your payment has been received and your order is now being processed. We will email you with updates.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{quotation.product_name}</h1>
          <p className="text-slate-500 mt-1">Reference: {quotation.reference}</p>
        </div>
        <Badge variant="outline" className={`text-sm px-3 py-1 ${getStatusColor(quotation.status)}`}>
          {quotation.status_label}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Specs */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Package className="w-5 h-5 mr-2 text-slate-400" /> Specifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                <div>
                  <span className="block text-slate-500 mb-1">Quantity</span>
                  <span className="font-medium text-slate-900">{quotation.quantity}</span>
                </div>
                {Object.entries(quotation.specifications || {}).map(([k, v]) => {
                  if (v === null || v === undefined || v === '') return null;
                  const label = k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                  const val = typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v);
                  return (
                    <div key={k}>
                      <span className="block text-slate-500 mb-1">{label}</span>
                      <span className="font-medium text-slate-900">{val}</span>
                    </div>
                  );
                })}
              </div>
              {quotation.customer_notes && (
                <div className="mt-6 pt-4 border-t border-slate-100">
                  <span className="block text-slate-500 text-sm mb-1">Additional Notes</span>
                  <p className="text-sm text-slate-900 whitespace-pre-wrap">{quotation.customer_notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Truck className="w-5 h-5 mr-2 text-slate-400" /> Delivery Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-1 text-slate-700">
                <p className="font-medium text-slate-900">{quotation.customer_name}</p>
                <p>{quotation.customer_phone}</p>
                <p>{quotation.customer_email}</p>
                <div className="mt-3 text-slate-600">
                  <p>{quotation.delivery_location?.address}</p>
                  <p>{quotation.delivery_location?.city}</p>
                  <p>{quotation.delivery_location?.state}, {quotation.delivery_location?.country || 'Nigeria'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Pricing & Action */}
        <div className="space-y-6">
          <Card className={isQuoteReady ? "border-blue-200 shadow-sm" : ""}>
            <CardHeader className={isQuoteReady ? "bg-blue-50/50" : ""}>
              <CardTitle className="text-lg">Quotation</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {isQuoteReady ? (
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="font-medium">₦{Number(quotation.customer_price || 0).toLocaleString('en-NG')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Shipping</span>
                    <span className="font-medium">
                      {Number(quotation.customer_shipping) > 0 
                        ? `₦${Number(quotation.customer_shipping).toLocaleString('en-NG')}` 
                        : 'Included'}
                    </span>
                  </div>
                  <div className="pt-4 border-t flex justify-between items-center">
                    <span className="font-bold text-slate-900">Total</span>
                    <span className="text-2xl font-bold text-blue-600">
                      ₦{Number(quotation.customer_total || 0).toLocaleString('en-NG')}
                    </span>
                  </div>

                  {quotation.quote_valid_until && (
                    <div className="flex items-center text-sm text-slate-500 mt-6 pt-4 border-t">
                      <Calendar className="w-4 h-4 mr-2" />
                      Valid until: {new Date(quotation.quote_valid_until).toLocaleDateString('en-NG')}
                    </div>
                  )}

                  {(quotation.estimated_production_days || quotation.estimated_delivery_days) && (
                    <div className="mt-4 p-3 bg-slate-50 rounded-md text-xs text-slate-600 space-y-1">
                      {quotation.estimated_production_days && (
                        <p><strong>Est. Production:</strong> {quotation.estimated_production_days} days</p>
                      )}
                      {quotation.estimated_delivery_days && (
                        <p><strong>Est. Delivery:</strong> {quotation.estimated_delivery_days} days after production</p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-500 text-sm">
                  <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-slate-300" />
                  <p>We are currently calculating your quotation with our suppliers.</p>
                  <p className="mt-2 text-xs">You will receive an email once it is ready.</p>
                </div>
              )}
            </CardContent>
            
            {(canAcceptDecline || canPay || isPaid || quotation.status === 'QUOTE_EXPIRED') && (
              <CardFooter className="flex-col gap-3 pt-0">
                {canAcceptDecline && (
                  <>
                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700" 
                      onClick={handleAccept} 
                      disabled={!!loading}
                    >
                      {loading === "accept" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                      Accept Quotation
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full text-slate-600" 
                      onClick={handleDecline} 
                      disabled={!!loading}
                    >
                      {loading === "decline" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                      Decline
                    </Button>
                    <p className="text-xs text-center text-slate-500 mt-2">
                      By accepting, you confirm your specifications are correct.
                    </p>
                  </>
                )}

                {canPay && (
                  <>
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg" 
                      onClick={handlePay} 
                      disabled={!!loading}
                    >
                      {loading === "pay" ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <CreditCard className="w-5 h-5 mr-2" />}
                      Proceed to Payment
                    </Button>
                    {quotation.payment_deadline && (
                      <p className="text-xs text-center text-red-500 mt-2 font-medium">
                        Payment must be completed by {new Date(quotation.payment_deadline).toLocaleString('en-NG')}
                      </p>
                    )}
                  </>
                )}

                {isPaid && (
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/account/orders">Track Order in Dashboard</Link>
                  </Button>
                )}

                {quotation.status === 'QUOTE_EXPIRED' && (
                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/quote?product_name=${encodeURIComponent(quotation.product_name)}`}>Request New Quotation</Link>
                  </Button>
                )}
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
