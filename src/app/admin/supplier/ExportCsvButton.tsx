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
      const orderId = order.id.split('-')[0].toUpperCase();
      const date = new Date(order.created_at).toLocaleDateString();
      const name = \"\"\;
      const phone = \"\"\;
      const street = \"\"\;
      const city = \"\"\;
      const state = \"\"\;

      if (order.order_items && order.order_items.length > 0) {
        order.order_items.forEach((item: any) => {
          const itemName = \"\"\;
          const sku = \"\"\;
          const qty = item.quantity;
          
          csvContent += \\,\,\,\,\,\,\,\,\,\\n\;
        });
      } else {
         csvContent += \\,\,\,\,\,\,\,"","",""\n\;
      }
    });

    // Create a Blob and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", \dropship_orders_\.csv\);
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
