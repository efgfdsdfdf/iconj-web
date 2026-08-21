import { Card, CardContent } from "@/components/ui/card";

export default function AdminSupplierPage() {
  return (
    <main className="flex-1 p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Supplier Balance</h1>
          <p className="text-sm text-slate-500">Track what you owe Qingyuan Leyou Household Products Co., Ltd.</p>
        </div>
      </div>
      <Card>
        <CardContent className="p-8 text-center text-slate-500">
          No pending balances.
        </CardContent>
      </Card>
    </main>
  );
}
