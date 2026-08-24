import { requireAdmin } from "@/lib/auth/admin";
import { getForwarders } from "./actions";
import { LogisticsSettingsClient } from "./LogisticsSettingsClient";

export const metadata = {
  title: "Logistics Settings | ICONJ Admin",
};

export default async function LogisticsSettingsPage() {
  await requireAdmin();
  const forwarders = await getForwarders();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Logistics Settings</h1>
        <p className="text-slate-500 mt-2">Manage Freight Forwarders, China Warehouses, and Shipping Rules.</p>
      </div>

      <LogisticsSettingsClient initialForwarders={forwarders} />
    </div>
  );
}
