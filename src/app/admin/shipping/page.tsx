import { verifyAdmin } from '@/lib/auth/admin';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { Package, Settings, AlertTriangle, FileText, List } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function AdminShippingDashboard() {
  const { isAdmin } = await verifyAdmin();
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  // Fetch settings
  const { data: settingsData } = await supabase.from('store_settings').select('id, value').like('id', 'ddp_%');
  const settings: Record<string, string> = {};
  settingsData?.forEach(s => settings[s.id.replace('ddp_', '')] = s.value);

  // Fetch active rates
  const { data: rates } = await supabase.from('ddp_rates').select('*').eq('is_active', true).order('weight_min_kg');

  // Fetch product data stats
  const { data: products } = await supabase.from('products').select('shipping_data_status');
  const stats = { MISSING: 0, PARTIAL: 0, CUSTOM_REQUIRED: 0, COMPLETE: 0 };
  products?.forEach(p => {
    if (stats[p.shipping_data_status as keyof typeof stats] !== undefined) {
      stats[p.shipping_data_status as keyof typeof stats]++;
    }
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Package className="w-6 h-6" /> Shipping Automation Dashboard
        </h1>
      </div>

      {settings.formulaStatus === '"PENDING_CONFIRMATION"' && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-md flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
          <div>
            <h3 className="text-amber-800 font-medium">Supplier DDP formula pending confirmation</h3>
            <p className="text-amber-700 text-sm mt-1">All shipping amounts shown to customers are ESTIMATES until confirmed in Settings.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/admin/shipping/rates">
          <Card className="hover:border-slate-400 transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><List className="w-5 h-5" /> Manage Rates</CardTitle>
              <CardDescription>Configure DDP weight brackets and rates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rates?.length || 0} active</div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/shipping/settings">
          <Card className="hover:border-slate-400 transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Settings className="w-5 h-5" /> Global Settings</CardTitle>
              <CardDescription>Volumetric divisor, markups, and formulas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-slate-600">Formula: {settings.formulaStatus?.replace(/"/g, '') || 'Unknown'}</div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/shipping/missing-data">
          <Card className="hover:border-slate-400 transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" /> Products Missing Data</CardTitle>
              <CardDescription>Fix dimensions and weights for products</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.MISSING + stats.PARTIAL} items</div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Active Rates</CardTitle>
        </CardHeader>
        <CardContent>
          {!rates || rates.length === 0 ? (
            <p className="text-sm text-slate-500">No active rates found. <Link href="/admin/shipping/rates" className="text-blue-600 hover:underline">Add rates</Link></p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-2 font-medium">Weight Range</th>
                    <th className="px-4 py-2 font-medium">Type</th>
                    <th className="px-4 py-2 font-medium">Amount</th>
                    <th className="px-4 py-2 font-medium">Currency</th>
                    <th className="px-4 py-2 font-medium">Effective From</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {rates.map(rate => (
                    <tr key={rate.id}>
                      <td className="px-4 py-3">{rate.weight_min_kg} - {rate.weight_max_kg ? `${rate.weight_max_kg} kg` : 'up'}</td>
                      <td className="px-4 py-3">{rate.rate_type}</td>
                      <td className="px-4 py-3">{rate.rate_type === 'per_kg' ? rate.rate_per_kg?.toLocaleString() : rate.flat_rate?.toLocaleString()}</td>
                      <td className="px-4 py-3">{rate.currency}</td>
                      <td className="px-4 py-3">{new Date(rate.effective_from).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
