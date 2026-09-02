const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'src/app/admin/orders/[id]/components/SupplierStatusPanel.tsx');

const content = `"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Package, Send, CheckCircle, Truck, RefreshCcw } from "lucide-react";
import { toast } from "react-hot-toast";

export function SupplierStatusPanel({ order }: { order: any }) {
  const [loading, setLoading] = useState(false);
  const status = order.logistics_status || "ORDER_RECEIVED";

  const handleAction = async (newStatus: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/orders/logistics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, status: newStatus })
      });
      if (!res.ok) throw new Error("Failed to update status");
      toast.success("Status updated!");
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-none shadow-sm mb-6">
      <CardHeader className="border-b bg-slate-50 pb-4">
        <CardTitle className="text-lg flex items-center gap-2"><Package className="w-5 h-5 text-indigo-500" /> Supplier Status</CardTitle>
        <CardDescription>Coordinate fulfillment with the supplier.</CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4 p-4 border rounded-lg bg-white shadow-sm">
            <div className={\`w-10 h-10 rounded-full flex items-center justify-center shrink-0 \${status === "ORDER_RECEIVED" || !order.logistics_status ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-400"}\`}>
              <RefreshCcw className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-slate-900">Order Received</h4>
              <p className="text-sm text-slate-500">Customer has paid and specifications are ready to be sent.</p>
            </div>
            {(status === "ORDER_RECEIVED" || !order.logistics_status) && (
              <Button onClick={() => handleAction("SENT_TO_SUPPLIER")} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
                Mark Sent to Supplier
              </Button>
            )}
          </div>

          <div className="flex items-center gap-4 p-4 border rounded-lg bg-white shadow-sm">
            <div className={\`w-10 h-10 rounded-full flex items-center justify-center shrink-0 \${status === "SENT_TO_SUPPLIER" ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-400"}\`}>
              <Send className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-slate-900">Sent to Supplier</h4>
              <p className="text-sm text-slate-500">Specifications have been sent. Waiting for supplier confirmation.</p>
            </div>
            {status === "SENT_TO_SUPPLIER" && (
              <Button onClick={() => handleAction("SUPPLIER_CONFIRMED")} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                Supplier Confirmed
              </Button>
            )}
          </div>

          <div className="flex items-center gap-4 p-4 border rounded-lg bg-white shadow-sm">
            <div className={\`w-10 h-10 rounded-full flex items-center justify-center shrink-0 \${status === "SUPPLIER_CONFIRMED" || status === "IN_FULFILLMENT" ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-400"}\`}>
              <CheckCircle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-slate-900">In Fulfillment</h4>
              <p className="text-sm text-slate-500">The supplier is actively preparing the customized order.</p>
            </div>
            {(status === "SUPPLIER_CONFIRMED" || status === "IN_FULFILLMENT") && (
              <Button onClick={() => handleAction("READY_FOR_SHIPPING")} disabled={loading} className="bg-amber-600 hover:bg-amber-700">
                Mark Ready for Shipping
              </Button>
            )}
          </div>

          <div className="flex items-center gap-4 p-4 border rounded-lg bg-white shadow-sm">
            <div className={\`w-10 h-10 rounded-full flex items-center justify-center shrink-0 \${status === "READY_FOR_SHIPPING" || status === "SHIPPED" ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"}\`}>
              <Truck className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-slate-900">Shipping & Delivery</h4>
              <p className="text-sm text-slate-500">Order is out for delivery.</p>
            </div>
            {status === "READY_FOR_SHIPPING" && (
              <Button onClick={() => handleAction("SHIPPED")} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
                Mark as Shipped
              </Button>
            )}
            {status === "SHIPPED" && (
              <Button onClick={() => handleAction("DELIVERED")} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
                Mark as Delivered
              </Button>
            )}
          </div>
          
        </div>
      </CardContent>
    </Card>
  );
}
`;
fs.writeFileSync(file, content);
console.log('Created SupplierStatusPanel');
