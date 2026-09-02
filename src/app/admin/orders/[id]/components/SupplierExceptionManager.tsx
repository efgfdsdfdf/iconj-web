"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";
import { toast } from "react-hot-toast";

export function SupplierExceptionManager({ orderId, currentIssues }: { orderId: string, currentIssues: any[] }) {
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [unavailableSpec, setUnavailableSpec] = useState("");
  const [alternative, setAlternative] = useState("");
  const [priceDiff, setPriceDiff] = useState("0");

  const activeIssue = currentIssues.find(i => i.issue_type === "SUPPLIER_CANNOT_FULFILL" && i.status === "OPEN");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/orders/exception", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          unavailableSpec,
          alternative,
          priceDifference: Number(priceDiff)
        })
      });
      if (!res.ok) throw new Error("Failed to report issue");
      toast.success("Order flagged and customer notified!");
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-orange-200 shadow-sm mb-6">
      <CardHeader className="border-b bg-orange-50 pb-4">
        <CardTitle className="text-lg text-orange-800 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" /> Supplier Fulfillment Exception
        </CardTitle>
        <CardDescription className="text-orange-700">
          Report an issue if the supplier cannot fulfill exact customer specifications.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {activeIssue ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-orange-600 font-bold mb-2">
              <Clock className="w-4 h-4" /> Waiting for Customer Decision
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm bg-orange-50 p-4 rounded-lg border border-orange-100">
              <div>
                <p className="font-semibold text-slate-500 mb-1">Unavailable Spec</p>
                <p className="text-slate-900">{activeIssue.expected_data?.unavailable_spec}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-500 mb-1">Alternative Offered</p>
                <p className="text-slate-900">{activeIssue.expected_data?.alternative_offered}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-500 mb-1">Price Difference</p>
                <p className="text-slate-900">?{activeIssue.expected_data?.price_difference}</p>
              </div>
            </div>
          </div>
        ) : (
          !showForm ? (
            <Button onClick={() => setShowForm(true)} variant="outline" className="border-orange-200 text-orange-700 hover:bg-orange-50">
              Report Missing Specification
            </Button>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Unavailable Specification (e.g., specific colour or size)</label>
                <input required value={unavailableSpec} onChange={e => setUnavailableSpec(e.target.value)} className="w-full border rounded-md p-2 text-sm" placeholder="e.g. Navy Blue fabric out of stock" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Alternative Offered</label>
                <textarea required value={alternative} onChange={e => setAlternative(e.target.value)} className="w-full border rounded-md p-2 text-sm" placeholder="e.g. Royal Blue fabric available instead" rows={3} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Price Difference (?) � Use negative for refund</label>
                <input required type="number" value={priceDiff} onChange={e => setPriceDiff(e.target.value)} className="w-full border rounded-md p-2 text-sm" placeholder="0" />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={loading} className="bg-orange-600 hover:bg-orange-700 text-white">
                  {loading ? "Saving..." : "Submit Exception"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          )
        )}
      </CardContent>
    </Card>
  );
}
