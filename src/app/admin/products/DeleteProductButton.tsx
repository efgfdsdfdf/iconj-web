"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { deleteProduct } from "../actions";

export function DeleteProductButton({ productId }: { productId: string }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    
    setLoading(true);
    try {
      const res = await deleteProduct(productId);
      if (res?.error) {
        alert("Failed to delete product: " + res.error + "\n\nTip: If a customer has already ordered this product, you cannot delete it because it would break their order receipt. Please 'Edit' the product and mark it 'Out of Stock' instead.");
      }
    } catch (error: any) {
      alert("Failed to delete product: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleDelete}
      disabled={loading} 
      className="text-red-500 hover:text-red-700 p-2 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
      title="Delete Product"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
