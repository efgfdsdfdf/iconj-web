"use client";

import { Button } from "@/components/ui/button";
import { Copy, CheckCircle2 } from "lucide-react";
import { useState } from "react";

export default function CopyOrderButton({ order }: { order: any }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    let text = \*NEW DROPSHIP ORDER*\n\n\;
    text += \*Order ID:* \\n\;
    text += \*Date:* \\n\n\;
    
    text += \*ITEMS:*\n\;
    order.order_items?.forEach((item: any) => {
      text += \- \x \\n\;
      text += \  SKU: \\n\;
    });
    
    text += \\n*SHIPPING ADDRESS:*\n\;
    text += \Name: \\n\;
    text += \Phone: \\n\;
    text += \Street: \\n\;
    text += \City: \\n\;
    text += \State: \\n\;
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleCopy}
      className={\lex items-center gap-2 \\}
    >
      {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      {copied ? "Copied format" : "Copy to Supplier"}
    </Button>
  );
}
