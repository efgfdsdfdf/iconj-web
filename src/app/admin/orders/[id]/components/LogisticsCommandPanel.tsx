"use client";

import { useState } from "react";
import { updateLogisticsStatus, recordForwarderReceipt, resolveLogisticsIssue } from "../actions/logistics";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AlertCircle, CheckCircle, Package, Send, Truck, Copy, AlertTriangle } from "lucide-react";

export function LogisticsCommandPanel({ order, items, activeForwarder, issues }: { order: any, items: any[], activeForwarder: any, issues: any[] }) {
  const [loading, setLoading] = useState(false);
  const [trackingNo, setTrackingNo] = useState("");
  const [receivedQty, setReceivedQty] = useState<number>(order.expected_quantity || items.reduce((acc, item) => acc + item.quantity, 0));
  const [weight, setWeight] = useState<number>(0);

  const status = order.logistics_status || "PENDING";
  const expectedQty = items.reduce((acc, item) => acc + item.quantity, 0);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const handleAction = async (newStatus: string, actionType: "status" | "receipt" = "status") => {
    setLoading(true);
    try {
      if (actionType === "receipt") {
        await recordForwarderReceipt(order.id, expectedQty, receivedQty, weight);
      } else {
        await updateLogisticsStatus(order.id, newStatus, trackingNo);
      }
      window.location.reload();
    } finally {
      setLoading(false);
    }
  };

  const generateSupplierMessage = () => {
    const itemDetails = items.map(i => `Product: ${i.configuration_details?.product_name}\nVariant: ${i.configuration_details?.variant_string || 'Standard'}\nQuantity: ${i.quantity}\nSupplier SKU: ${i.configuration_details?.supplier_sku || 'N/A'}\nURL: ${i.configuration_details?.supplier_product_url || 'N/A'}`).join("\n\n");
    return `NEW ORDER [ICONJ-${order.id.split('-')[0].toUpperCase()}]\n\n${itemDetails}\n\nSHIP TO CHINA WAREHOUSE:\n${activeForwarder ? `${activeForwarder.china_warehouse_name}\n${activeForwarder.china_warehouse_address}\nContact: ${activeForwarder.china_warehouse_contact}\nPhone: ${activeForwarder.china_warehouse_phone}\nCode: ${activeForwarder.iconj_account_code}` : "NO ACTIVE FORWARDER CONFIGURED"}`;
  };

  const generateForwarderMessage = () => {
    const itemDetails = items.map(i => `${i.quantity}x ${i.configuration_details?.product_name} (${i.configuration_details?.variant_string || 'Standard'})`).join("\n");
    return `NEW FORWARDING REQUEST [ICONJ-${order.id.split('-')[0].toUpperCase()}]\n\nEXPECTED ARRIVAL:\nTracking: ${order.supplier_tracking_number || "Pending"}\nItems:\n${itemDetails}\n\nFINAL NIGERIA DESTINATION:\nName: ${order.delivery_address?.name}\nPhone: ${order.delivery_address?.phone}\nAddress: ${order.delivery_address?.street}, ${order.delivery_address?.city}, ${order.delivery_address?.state}`;
  };

  return (
    <div className="space-y-6">
      {/* Order Health Indicator */}
      <div className="flex gap-4 p-4 rounded-lg bg-slate-900 text-white items-center">
        <Package className="w-6 h-6 text-blue-400" />
        <div className="flex-1">
          <h3 className="font-bold text-lg">Order Command Center</h3>
          <p className="text-slate-300 text-sm">Status: <span className="text-yellow-400 font-bold">{status.replace(/_/g, ' ')}</span></p>
        </div>
      </div>

      {issues.filter(i => i.status === 'OPEN').map(issue => (
        <div key={issue.id} className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-red-600 shrink-0" />
          <div className="flex-1">
            <h4 className="font-bold text-red-900">Issue Detected: {issue.issue_type.replace(/_/g, ' ')}</h4>
            <p className="text-red-700 text-sm">{issue.description}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => resolveLogisticsIssue(issue.id)}>Mark Resolved</Button>
        </div>
      ))}

      <div className="grid md:grid-cols-2 gap-6">
        {/* SUPPLIER PANEL */}
        <Card>
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="text-lg flex items-center"><Send className="w-5 h-5 mr-2 text-indigo-600"/> Supplier Fulfillment</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <Button variant="outline" className="w-full text-left justify-start h-auto p-4" onClick={() => copyToClipboard(generateSupplierMessage())}>
              <div>
                <div className="font-bold text-slate-900 flex items-center"><Copy className="w-4 h-4 mr-2"/> Copy Supplier Request</div>
                <div className="text-xs text-slate-500 mt-1 font-mono break-all">{generateSupplierMessage().substring(0, 100)}...</div>
              </div>
            </Button>
            
            {status === "PENDING" && (
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={loading} onClick={() => handleAction("SENT_TO_SUPPLIER")}>Mark Sent to Supplier</Button>
            )}
            
            {status === "SENT_TO_SUPPLIER" && (
              <div className="space-y-3 p-4 bg-slate-50 rounded-lg border">
                <Input placeholder="Enter Supplier Tracking Number (CN...)" value={trackingNo} onChange={e => setTrackingNo(e.target.value)} />
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={loading || !trackingNo} onClick={() => handleAction("SUPPLIER_SHIPPED")}>Mark Supplier Shipped</Button>
              </div>
            )}
            
            {status === "SUPPLIER_SHIPPED" && (
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading} onClick={() => handleAction("DELIVERED_TO_CHINA")}>Confirm Delivery at China Warehouse</Button>
            )}

            {order.supplier_tracking_number && (
              <div className="text-sm p-3 bg-slate-100 rounded">
                <span className="font-bold">Supplier Tracking:</span> {order.supplier_tracking_number}
              </div>
            )}
          </CardContent>
        </Card>

        {/* FORWARDER PANEL */}
        <Card>
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="text-lg flex items-center"><Truck className="w-5 h-5 mr-2 text-orange-600"/> Freight Forwarder</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <Button variant="outline" className="w-full text-left justify-start h-auto p-4" onClick={() => copyToClipboard(generateForwarderMessage())}>
              <div>
                <div className="font-bold text-slate-900 flex items-center"><Copy className="w-4 h-4 mr-2"/> Copy Forwarding Request</div>
                <div className="text-xs text-slate-500 mt-1 font-mono break-all">{generateForwarderMessage().substring(0, 100)}...</div>
              </div>
            </Button>

            {status === "DELIVERED_TO_CHINA" && (
              <div className="space-y-4 p-4 bg-slate-50 rounded-lg border">
                <div>
                  <label className="text-sm font-bold">Received Quantity (Expected: {expectedQty})</label>
                  <Input type="number" value={receivedQty} onChange={e => setReceivedQty(Number(e.target.value))} />
                </div>
                <div>
                  <label className="text-sm font-bold">Chargeable Weight (kg)</label>
                  <Input type="number" step="0.1" value={weight} onChange={e => setWeight(Number(e.target.value))} />
                </div>
                <Button className="w-full bg-orange-600 hover:bg-orange-700" disabled={loading} onClick={() => handleAction("FORWARDER_RECEIVED", "receipt")}>Mark Forwarder Received</Button>
              </div>
            )}

            {status === "FORWARDER_RECEIVED" && (
              <div className="space-y-3 p-4 bg-slate-50 rounded-lg border">
                <Input placeholder="Enter Forwarder Tracking Number" value={trackingNo} onChange={e => setTrackingNo(e.target.value)} />
                <Button className="w-full bg-orange-600 hover:bg-orange-700" disabled={loading || !trackingNo} onClick={() => handleAction("SHIPPED_TO_NIGERIA")}>Mark Shipped to Nigeria</Button>
              </div>
            )}

            {status === "SHIPPED_TO_NIGERIA" && (
              <Button className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading} onClick={() => handleAction("ARRIVED_IN_NIGERIA")}>Mark Arrived in Nigeria</Button>
            )}
            
            {status === "ARRIVED_IN_NIGERIA" && (
              <Button className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading} onClick={() => handleAction("OUT_FOR_DELIVERY")}>Mark Out for Delivery</Button>
            )}
            
            {status === "OUT_FOR_DELIVERY" && (
              <Button className="w-full bg-green-600 hover:bg-green-700" disabled={loading} onClick={() => handleAction("DELIVERED")}>Confirm Final Delivery</Button>
            )}

            {order.forwarder_tracking_number && (
              <div className="text-sm p-3 bg-slate-100 rounded">
                <span className="font-bold">Forwarder Tracking:</span> {order.forwarder_tracking_number}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
