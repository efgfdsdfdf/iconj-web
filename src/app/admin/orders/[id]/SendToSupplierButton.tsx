"use client";

import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";

export function SendToSupplierButton({ order, items }: { order: any, items: any[] }) {
  const handleSend = () => {
    const address = order.delivery_address || {};
    const orderId = order.id.split("-")[0].toUpperCase();
    
    let body = `Hello Qingyuan Leyou Team,\n\n`;
    body += `Please process the following new order (ID: #${orderId}).\n\n`;
    
    body += `--- ORDER ITEMS ---\n`;
    items.forEach((item, index) => {
      body += `${index + 1}. ${item.product?.name || "Unknown Product"} (SKU: ${item.product?.sku || "N/A"})\n`;
      body += `   Quantity: ${item.quantity}\n`;
      if (item.configuration?.width) body += `   Size: ${item.configuration.width}cm x ${item.configuration.height}cm\n`;
      if (item.configuration?.motorType) body += `   Motor: ${item.configuration.motorType}\n`;
      if (item.configuration?.fabric) body += `   Fabric: ${item.configuration.fabric}\n`;
      body += `\n`;
    });
    
    body += `--- SHIPPING ADDRESS ---\n`;
    body += `${address.street || "N/A"}\n`;
    body += `${address.city || "N/A"}\n`;
    body += `${address.state || "N/A"}\n\n`;
    
    body += `Please confirm receipt of this order and provide tracking information when dispatched.\n\n`;
    body += `Thank you,\nICONJ Team`;
    
    const encodedBody = encodeURIComponent(body);
    const encodedSubject = encodeURIComponent(`New Order Request - ICONJ #${orderId}`);
    
    // Using a mailto link to open the users default email client
    window.location.href = `mailto:supplier@example.com?subject=${encodedSubject}&body=${encodedBody}`;
  };

  return (
    <Button onClick={handleSend} className="bg-blue-600 hover:bg-blue-700">
      <Package className="w-4 h-4 mr-2" /> Send to Supplier
    </Button>
  );
}
