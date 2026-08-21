import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminSettingsPage() {
  return (
    <main className="flex-1 p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500">Platform configuration and API keys.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Global Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500 mb-4">Margin Multiplier: 30%</p>
          <p className="text-sm text-slate-500">Supplier: Qingyuan Leyou Household Products Co., Ltd.</p>
        </CardContent>
      </Card>
    </main>
  );
}
