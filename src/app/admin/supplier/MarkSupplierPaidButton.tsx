"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";

export function MarkSupplierPaidButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleMarkPaid = async () => {
    setLoading(true);
    const { error } = await supabase
      .from("orders")
      .update({ supplier_paid: true })
      .eq("id", orderId);

    if (error) {
      console.error(error);
      toast.error("Failed to update status");
      setLoading(false);
      return;
    }

    toast.success("Marked as Paid to Supplier");
    setLoading(false);
    router.refresh();
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleMarkPaid} 
      disabled={loading}
      className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 ml-2"
    >
      <CheckCircle2 className="w-4 h-4 mr-2" />
      {loading ? "Saving..." : "Mark Paid"}
    </Button>
  );
}
