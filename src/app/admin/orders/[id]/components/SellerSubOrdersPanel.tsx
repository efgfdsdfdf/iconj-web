"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Truck, CheckCircle2, User } from "lucide-react";

export function SellerSubOrdersPanel({ subOrders }: { subOrders: any[] }) {
  
  if (!subOrders || subOrders.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-slate-500">
          No seller sub-orders found for this order.
        </CardContent>
      </Card>
    );
  }

  const statusColors: Record<string, string> = {
    PENDING_PAYMENT: "bg-yellow-100 text-yellow-800",
    PROCESSING: "bg-blue-100 text-blue-800",
    SHIPPED: "bg-purple-100 text-purple-800",
    DELIVERED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
        <Package className="w-5 h-5 text-slate-500" /> Vendor Fulfillment Status
      </h2>
      
      {subOrders.map(so => {
        const businessName = so.sellers?.businesses?.business_name || "ICON Official";
        const totalItems = so.order_items?.length || 0;
        
        return (
          <Card key={so.id} className="overflow-hidden">
            <div className="bg-slate-50 border-b p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Fulfilling Vendor</p>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">{businessName}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Status</p>
                  <Badge className={statusColors[so.status] || "bg-slate-100 text-slate-700"}>{so.status}</Badge>
                </div>
                <div className="text-right border-l pl-3">
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Payout</p>
                  <p className="font-bold text-slate-900">₦{so.total_amount?.toLocaleString()}</p>
                </div>
              </div>
            </div>
            <CardContent className="p-0 divide-y">
              {so.order_items?.map((item: any) => (
                <div key={item.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100 rounded border flex items-center justify-center text-slate-400">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{item.configuration_details?.product_name || 'Product'}</p>
                      <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <p className="font-bold text-sm">₦{(item.unit_price * item.quantity).toLocaleString()}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
