import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Truck, Package, Clock, MapPin, AlertCircle } from "lucide-react";
import Link from "next/link";

export default async function OrderTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Track Your Order</h1>
          <p className="text-slate-500">Order #{id} - Placed on May 12, 2024</p>
        </div>
        <span className="bg-amber-100 text-amber-700 font-bold px-3 py-1 rounded-full text-sm">
          In Production
        </span>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Tracking Timeline */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Order Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                
                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-emerald-500 text-slate-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border border-slate-200 shadow-sm bg-white">
                    <div className="flex items-center justify-between space-x-2 mb-1">
                      <div className="font-bold text-slate-900 text-sm">Order Placed</div>
                      <time className="text-xs font-medium text-slate-500">May 12, 10:30 AM</time>
                    </div>
                  </div>
                </div>
                
                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-emerald-500 text-slate-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border border-slate-200 shadow-sm bg-white">
                    <div className="flex items-center justify-between space-x-2 mb-1">
                      <div className="font-bold text-slate-900 text-sm">Payment Confirmed</div>
                      <time className="text-xs font-medium text-slate-500">May 12, 10:35 AM</time>
                    </div>
                  </div>
                </div>

                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-emerald-500 text-slate-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border border-slate-200 shadow-sm bg-white">
                    <div className="flex items-center justify-between space-x-2 mb-1">
                      <div className="font-bold text-slate-900 text-sm">Processing</div>
                      <time className="text-xs font-medium text-slate-500">May 12, 02:00 PM</time>
                    </div>
                  </div>
                </div>

                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-blue-600 text-slate-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                    <Clock className="w-5 h-5 animate-pulse" />
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border-2 border-blue-600 shadow-md bg-blue-50/50">
                    <div className="flex items-center justify-between space-x-2 mb-1">
                      <div className="font-bold text-blue-900 text-sm">In Production</div>
                      <time className="text-xs font-medium text-blue-600">May 13, 09:00 AM</time>
                    </div>
                    <div className="text-xs text-blue-800 mt-2">Supplier is preparing your order.</div>
                  </div>
                </div>

                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-200 text-slate-400 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border border-slate-200 bg-slate-50 opacity-60">
                    <div className="font-bold text-slate-500 text-sm">Shipped</div>
                  </div>
                </div>
                
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-500">
                  <Truck className="w-4 h-4" /> Tracking Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-500">Tracking Number</p>
                    <p className="font-bold text-slate-900">Pending Assignment</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Carrier</p>
                    <p className="font-medium text-slate-900">ICONJ Logistics</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Estimated Delivery</p>
                    <p className="font-medium text-slate-900">May 30 - May 31, 2024</p>
                  </div>
                  <Button variant="outline" className="w-full mt-2" disabled>View on Map</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-500">
                  <MapPin className="w-4 h-4" /> Delivery Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm leading-relaxed text-slate-700">
                  <span className="font-bold block text-slate-900">John Doe</span>
                  123 Marina Street,<br />
                  Lagos Island, Lagos,<br />
                  Nigeria<br />
                  <span className="text-slate-500 mt-2 block">08012345678</span>
                </div>
                <div className="mt-4 p-3 bg-blue-50 text-blue-800 text-xs rounded border border-blue-100 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  You will receive a text notification when your order is out for delivery.
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Items Ordered</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 bg-slate-100 rounded overflow-hidden border">
                  <img src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&w=150&q=80" alt="Product" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-semibold text-slate-900">20FT Expandable Container House</h4>
                    <p className="font-bold text-slate-900">?3,250,000</p>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">Qty: 1</p>
                  <div className="text-xs text-slate-500 mt-2 space-y-0.5">
                    <p><span className="text-slate-400">Wall Panel:</span> 75mm EPS</p>
                    <p><span className="text-slate-400">Windows:</span> Aluminum Sliding</p>
                    <p><span className="text-slate-400">Electrical:</span> Standard</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
