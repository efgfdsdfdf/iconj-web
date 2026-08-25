"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export function ClearAllSellersButton({ action }: { action: (formData: FormData) => void }) {
  return (
    <form action={action}>
      <Button 
        type="submit" 
        variant="outline" 
        className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 text-xs"
        onClick={(e) => {
          if (!confirm('⚠️ WARNING: This will permanently delete ALL sellers, their stores, products, and financial data. This cannot be undone. Are you sure?')) {
            e.preventDefault();
          }
        }}>
        <AlertTriangle className="w-3.5 h-3.5 mr-1.5" /> Clear All Sellers (Testing)
      </Button>
    </form>
  );
}
