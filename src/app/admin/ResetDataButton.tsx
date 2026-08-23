"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import { resetStoreData } from "./actions/reset";
import { useRouter } from "next/navigation";

export function ResetDataButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleReset = async () => {
    if (!confirm("WARNING: You are about to permanently delete all test orders, notifications, and reset all supplier ledgers to zero.\n\nAre you absolutely sure you want to proceed?")) {
      return;
    }
    
    setLoading(true);
    try {
      const res = await resetStoreData();
      if (res?.error) throw new Error(res.error);
      
      toast.success("Store test data has been successfully reset!");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to reset data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      variant="destructive" 
      onClick={handleReset} 
      disabled={loading}
      className="bg-red-500 hover:bg-red-600 text-white font-bold"
    >
      <AlertTriangle className="w-4 h-4 mr-2" />
      {loading ? "Wiping Data..." : "Wipe Test Data & Reset System"}
    </Button>
  );
}