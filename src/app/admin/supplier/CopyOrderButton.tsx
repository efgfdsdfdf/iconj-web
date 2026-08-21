"use client";

import { Button } from "@/components/ui/button";
import { Copy, CheckCircle2 } from "lucide-react";
import { useState } from "react";

export default function CopyOrderButton({ order }: { order: any }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    let text = `*NEW DROPSHIP ORDER*\n\n`;
    text += `*Order Ref:* ICONJ-${order.id.split('-')[0].toUpperCase()}\n`;
    text += `*Date:* ${new Date(order.created_at).toLocaleDateString()}\n\n`;
    
    text += `*ITEMS:*\n`;
    order.order_items?.forEach((item: any) => {
      text += `- ${item.quantity}x ${item.products?.name}\n`;
      text += `  SKU: ${item.products?.supplier_sku || 'N/A'}\n`;
    });
    
    text += `\n*SHIPPING ADDRESS:*\n`;
    text += `Name: ${order.delivery_address?.name || order.profiles?.name || 'Customer'}\n`;
    text += `Phone: ${order.delivery_address?.phone || 'N/A'}\n`;
    text += `Street: ${order.delivery_address?.street}\n`;
    text += `City: ${order.delivery_address?.city}\n`;
    text += `State: ${order.delivery_address?.state}\n`;
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleCopy}
      className={`flex items-center gap-2 ${copied ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : ''}`}
    >
      {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      {copied ? "Copied format" : "Copy to Supplier"}
    </Button>
  );
}
