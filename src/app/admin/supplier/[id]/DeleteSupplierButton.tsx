"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { deleteSupplier } from "./actions";

export function DeleteSupplierButton({ supplierId, supplierName }: { supplierId: string, supplierName: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm(`Are you absolutely sure you want to delete ${supplierName}?\nThis will also delete their entire ledger history permanently!`)) {
      return;
    }
    
    setLoading(true);
    try {
      await deleteSupplier(supplierId);
      toast.success("Supplier deleted successfully!");
      router.push("/admin/supplier");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete supplier.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      variant="destructive" 
      size="sm" 
      onClick={handleDelete}
      disabled={loading}
      className="ml-4"
    >
      <Trash2 className="w-4 h-4 mr-2" />
      {loading ? "Deleting..." : "Delete Supplier"}
    </Button>
  );
}
