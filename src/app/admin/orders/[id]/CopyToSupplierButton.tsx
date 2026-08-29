"use client";

import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

export function CopyToSupplierButton({ item }: { item: any }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const config = item.configuration_details || {};
    const url = item.product?.variants?.supplier_product_url || "";
    const sku = item.product?.supplier_sku || item.product?.sku || config.store_sku || "";
    
    let specs = [];
    if (config.width && config.width !== '0cm' && config.width !== 'Standard') specs.push(`Width: ${config.width}`);
    if (config.height && config.height !== '0cm' && config.height !== 'Standard') specs.push(`Height: ${config.height}`);
    if (config.motorType) specs.push(`Motor: ${config.motorType}`);
    if (config.variant_string) specs.push(`Variant: ${config.variant_string}`);
    if (config.custom_notes) specs.push(`Notes: ${config.custom_notes}`);

    const textToCopy = `Order Request
Product: ${config.product_name || item.product?.name}
SKU: ${sku}
Quantity: ${item.quantity}
${url ? `URL: ${url}\n` : ''}
Details:
${specs.join('\n')}`;

    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error("Failed to copy:", err);
      toast.error("Failed to copy");
    });
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleCopy}
      className={`ml-auto shrink-0 flex items-center gap-2 ${copied ? 'bg-green-50 text-green-700 border-green-200' : 'hover:bg-slate-50'}`}
    >
      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4 text-slate-500" />}
      <span className="hidden sm:inline">{copied ? "Copied!" : "Copy to Supplier"}</span>
    </Button>
  );
}
