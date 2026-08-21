"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export function ExportCsvButton({ orders }: { orders: any[] }) {
  const handleDownload = () => {
    if (!orders || orders.length === 0) {
      alert("No pending orders to export.");
      return;
    }

    // CSV Headers
    const headers = [
      "Order ID", 
      "Date", 
      "Customer Name", 
      "Phone", 
      "Street", 
      "City", 
      "State", 
      "Item Name", 
      "SKU", 
      "Quantity"
    ];

    let csvContent = headers.join(",") + "\n";

    // Format data rows
    orders.forEach(order => {
      const orderId = `ICONJ-${order.id.split('-')[0].toUpperCase()}`;
      const date = new Date(order.created_at).toLocaleDateString();
      const name = `"${order.delivery_address?.name || order.profiles?.name || 'Customer'}"`;
      const phone = `"${order.delivery_address?.phone || ''}"`;
      const street = `"${order.delivery_address?.street || ''}"`;
      const city = `"${order.delivery_address?.city || ''}"`;
      const state = `"${order.delivery_address?.state || ''}"`;

      if (order.order_items && order.order_items.length > 0) {
        order.order_items.forEach((item: any) => {
          const itemName = `"${item.products?.name || ''}"`;
          const sku = `"${item.products?.supplier_sku || ''}"`;
          const qty = item.quantity;
          
          csvContent += `${orderId},${date},${name},${phone},${street},${city},${state},${itemName},${sku},${qty}\n`;
        });
      } else {
         csvContent += `${orderId},${date},${name},${phone},${street},${city},${state},"","",""\n`;
      }
    });

    // Create a Blob and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `dropship_orders_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Button onClick={handleDownload} className="bg-emerald-600 hover:bg-emerald-700">
      <Download className="w-4 h-4 mr-2" />
      Export CSV for Supplier
    </Button>
  );
}
