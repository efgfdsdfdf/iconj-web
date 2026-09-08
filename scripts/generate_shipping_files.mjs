import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..', 'src', 'app');

const files = {
  'api/admin/shipping/rates/route.ts': `import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdmin } from '@/lib/auth/admin';

export async function GET() {
  const { isAdmin } = await verifyAdmin();
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  const { data, error } = await supabase
    .from('ddp_rates')
    .select('*')
    .order('effective_from', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const { isAdmin } = await verifyAdmin();
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { weight_min_kg, weight_max_kg, rate_type, rate_per_kg, flat_rate, currency, destination, shipping_method, supplier_id, notes } = body;

    if (rate_type === 'per_kg' && rate_per_kg === undefined) {
      return NextResponse.json({ error: 'rate_per_kg is required for per_kg type' }, { status: 400 });
    }
    if (rate_type === 'flat' && flat_rate === undefined) {
      return NextResponse.json({ error: 'flat_rate is required for flat type' }, { status: 400 });
    }

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    
    const { data, error } = await supabase
      .from('ddp_rates')
      .insert([{
        weight_min_kg,
        weight_max_kg,
        rate_type,
        rate_per_kg: rate_type === 'per_kg' ? rate_per_kg : null,
        flat_rate: rate_type === 'flat' ? flat_rate : null,
        currency: currency || 'CNY',
        destination: destination || 'NG',
        shipping_method: shipping_method || 'AIR_CARGO',
        supplier_id,
        notes,
        is_active: true
      }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
`,

  'api/admin/shipping/rates/[id]/route.ts': `import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdmin } from '@/lib/auth/admin';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { isAdmin } = await verifyAdmin();
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const resolvedParams = await params;
  const id = resolvedParams.id;
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  const { data, error } = await supabase
    .from('ddp_rates')
    .update({ 
      is_active: false, 
      effective_to: new Date().toISOString() 
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { isAdmin } = await verifyAdmin();
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const resolvedParams = await params;
  const id = resolvedParams.id;
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  // Check if used in shipping_calculations
  const { data: usage, error: usageErr } = await supabase
    .from('shipping_calculations')
    .select('id')
    .eq('ddp_rate_id', id)
    .limit(1);

  if (usageErr) return NextResponse.json({ error: usageErr.message }, { status: 500 });
  if (usage && usage.length > 0) {
    return NextResponse.json({ error: 'Rate cannot be deleted as it is used in existing shipping calculations. Please deactivate it instead.' }, { status: 400 });
  }

  const { error } = await supabase
    .from('ddp_rates')
    .delete()
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
`,

  'api/admin/shipping/settings/route.ts': `import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdmin } from '@/lib/auth/admin';
import { invalidateSettingsCache } from '@/lib/shipping';

export async function GET() {
  const { isAdmin } = await verifyAdmin();
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  const { data, error } = await supabase
    .from('store_settings')
    .select('key, value')
    .like('key', 'ddp_%');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const settings: Record<string, any> = {};
  data.forEach(setting => {
    const cleanKey = setting.key.replace('ddp_', '');
    let val = setting.value;
    try { val = JSON.parse(val); } catch (e) {}
    settings[cleanKey] = val;
  });

  return NextResponse.json(settings);
}

export async function PATCH(req: Request) {
  const { isAdmin } = await verifyAdmin();
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    
    const allowedKeys = ['volumetricDivisor', 'divisorStatus', 'formulaStatus', 'markupPct', 'chargeableWeightMethod', 'roundingMethod'];
    
    for (const key of allowedKeys) {
      if (body[key] !== undefined) {
        const val = typeof body[key] === 'string' ? body[key] : JSON.stringify(body[key]);
        const { error } = await supabase
          .from('store_settings')
          .upsert({ key: \`ddp_\${key}\`, value: val, updated_at: new Date().toISOString() }, { onConflict: 'key' });
        if (error) throw error;
      }
    }

    await invalidateSettingsCache();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
`,

  'api/admin/shipping/missing-data/route.ts': `import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdmin } from '@/lib/auth/admin';

export async function GET() {
  const { isAdmin } = await verifyAdmin();
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  const { data, error } = await supabase
    .from('products')
    .select('id, name, sku, shipping_weight_kg, shipping_length_cm, shipping_width_cm, shipping_height_cm, shipping_data_status, is_configurable, category')
    .neq('shipping_data_status', 'COMPLETE')
    .order('name');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const summary = {
    MISSING: 0,
    PARTIAL: 0,
    CUSTOM_REQUIRED: 0,
    COMPLETE: 0
  };

  data.forEach(p => {
    if (summary[p.shipping_data_status as keyof typeof summary] !== undefined) {
      summary[p.shipping_data_status as keyof typeof summary]++;
    }
  });

  return NextResponse.json({ products: data, summary });
}
`,

  'api/admin/shipping/bulk-update/route.ts': `import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdmin } from '@/lib/auth/admin';

export async function POST(req: Request) {
  const { isAdmin } = await verifyAdmin();
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { updates } = body;
    if (!Array.isArray(updates)) return NextResponse.json({ error: 'updates must be an array' }, { status: 400 });

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    
    let successCount = 0;
    const failures = [];

    for (const update of updates) {
      const { product_id, shipping_weight_kg, shipping_length_cm, shipping_width_cm, shipping_height_cm, shipping_packaging_type, shipping_notes } = update;
      
      const toUpdate: any = {};
      if (shipping_weight_kg !== undefined) toUpdate.shipping_weight_kg = shipping_weight_kg;
      if (shipping_length_cm !== undefined) toUpdate.shipping_length_cm = shipping_length_cm;
      if (shipping_width_cm !== undefined) toUpdate.shipping_width_cm = shipping_width_cm;
      if (shipping_height_cm !== undefined) toUpdate.shipping_height_cm = shipping_height_cm;
      if (shipping_packaging_type !== undefined) toUpdate.shipping_packaging_type = shipping_packaging_type;
      if (shipping_notes !== undefined) toUpdate.shipping_notes = shipping_notes;

      // Determine new status based on data
      const hasWeight = toUpdate.shipping_weight_kg > 0;
      const hasDims = toUpdate.shipping_length_cm > 0 && toUpdate.shipping_width_cm > 0 && toUpdate.shipping_height_cm > 0;
      
      if (hasWeight && hasDims) {
        toUpdate.shipping_data_status = 'COMPLETE';
      } else if (hasWeight || hasDims) {
        toUpdate.shipping_data_status = 'PARTIAL';
      } else {
        toUpdate.shipping_data_status = 'MISSING';
      }

      const { error } = await supabase
        .from('products')
        .update(toUpdate)
        .eq('id', product_id);

      if (error) {
        failures.push({ product_id, error: error.message });
      } else {
        successCount++;
      }
    }

    return NextResponse.json({ successCount, failures });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
`,

  'api/admin/shipping/confirm/[orderId]/route.ts': `import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdmin } from '@/lib/auth/admin';

export async function POST(req: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const { admin, isAdmin } = await verifyAdmin();
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const resolvedParams = await params;
    const orderId = resolvedParams.orderId;
    const body = await req.json();
    const { confirmedShippingAmount, notes } = body;

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    
    // 1. Fetch snapshot
    const { data: snapshot, error: snapErr } = await supabase
      .from('order_shipping_snapshots')
      .select('*')
      .eq('order_id', orderId)
      .single();
      
    if (snapErr) throw snapErr;

    const originalAmount = snapshot.customer_shipping_price || 0;
    const difference = confirmedShippingAmount - originalAmount;

    // 2. Update snapshot
    const { error: snapUpdErr } = await supabase
      .from('order_shipping_snapshots')
      .update({
        customer_shipping_price: confirmedShippingAmount,
        shipping_status: 'ADMIN_CONFIRMED',
        confirmed_by: admin?.email || 'admin',
        confirmed_at: new Date().toISOString(),
        admin_notes: notes
      })
      .eq('order_id', orderId);

    if (snapUpdErr) throw snapUpdErr;

    // 3 & 4. Update orders
    // Fetch order first to calculate new total
    const { data: order, error: orderFetchErr } = await supabase
      .from('orders')
      .select('total_amount')
      .eq('id', orderId)
      .single();
      
    if (orderFetchErr) throw orderFetchErr;

    const newTotalAmount = (order.total_amount || 0) + difference;

    const { error: orderUpdErr } = await supabase
      .from('orders')
      .update({
        confirmed_shipping: confirmedShippingAmount,
        shipping_status: 'ADMIN_CONFIRMED',
        shipping_cost: confirmedShippingAmount,
        total_amount: newTotalAmount
      })
      .eq('id', orderId);

    if (orderUpdErr) throw orderUpdErr;

    return NextResponse.json({ success: true, oldAmount: originalAmount, newAmount: confirmedShippingAmount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
`,

  'admin/shipping/page.tsx': `import { verifyAdmin } from '@/lib/auth/admin';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { Package, Settings, AlertTriangle, FileText, List } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function AdminShippingDashboard() {
  const { isAdmin } = await verifyAdmin();
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  // Fetch settings
  const { data: settingsData } = await supabase.from('store_settings').select('key, value').like('key', 'ddp_%');
  const settings: Record<string, string> = {};
  settingsData?.forEach(s => settings[s.key.replace('ddp_', '')] = s.value);

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
                      <td className="px-4 py-3">{rate.weight_min_kg} - {rate.weight_max_kg ? \`\${rate.weight_max_kg} kg\` : 'up'}</td>
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
`,

  'admin/shipping/rates/page.tsx': `"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function RatesPage() {
  const [rates, setRates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    weight_min_kg: '',
    weight_max_kg: '',
    rate_type: 'per_kg',
    amount: '',
    currency: 'CNY',
    notes: ''
  });

  const fetchRates = async () => {
    const res = await fetch('/api/admin/shipping/rates');
    const data = await res.json();
    setRates(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      weight_min_kg: parseFloat(formData.weight_min_kg),
      weight_max_kg: formData.weight_max_kg ? parseFloat(formData.weight_max_kg) : null,
      rate_type: formData.rate_type,
      rate_per_kg: formData.rate_type === 'per_kg' ? parseFloat(formData.amount) : null,
      flat_rate: formData.rate_type === 'flat' ? parseFloat(formData.amount) : null,
      currency: formData.currency,
      notes: formData.notes
    };

    await fetch('/api/admin/shipping/rates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    setShowForm(false);
    setFormData({ weight_min_kg: '', weight_max_kg: '', rate_type: 'per_kg', amount: '', currency: 'CNY', notes: '' });
    fetchRates();
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm('Deactivate this rate?')) return;
    await fetch(\`/api/admin/shipping/rates/\${id}\`, { method: 'PATCH' });
    fetchRates();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this rate permanently?')) return;
    const res = await fetch(\`/api/admin/shipping/rates/\${id}\`, { method: 'DELETE' });
    const data = await res.json();
    if (data.error) alert(data.error);
    else fetchRates();
  };

  const activeRates = rates.filter(r => r.is_active);
  const historyRates = rates.filter(r => !r.is_active);

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Shipping Rates</h1>
          <p className="text-slate-500">Manage DDP rates from suppliers</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4 mr-2" /> Add New Rate</Button>
      </div>

      <Alert>
        <AlertTitle>Note</AlertTitle>
        <AlertDescription>Adding a new rate does not affect existing orders. Historical rates are preserved.</AlertDescription>
      </Alert>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Create New Rate</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Min Weight (kg)</Label>
                  <Input type="number" step="0.01" required value={formData.weight_min_kg} onChange={e => setFormData({...formData, weight_min_kg: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Max Weight (kg) - Leave empty for no upper limit</Label>
                  <Input type="number" step="0.01" value={formData.weight_max_kg} onChange={e => setFormData({...formData, weight_max_kg: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Rate Type</Label>
                  <Select value={formData.rate_type} onValueChange={v => setFormData({...formData, rate_type: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="per_kg">Per KG</SelectItem>
                      <SelectItem value="flat">Flat Rate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Amount</Label>
                  <Input type="number" step="0.01" required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Input value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Input value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit">Save Rate</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Active Rates</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-2 font-medium">Weight Range</th>
                <th className="px-4 py-2 font-medium">Type</th>
                <th className="px-4 py-2 font-medium">Amount</th>
                <th className="px-4 py-2 font-medium">Currency</th>
                <th className="px-4 py-2 font-medium">Effective From</th>
                <th className="px-4 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {activeRates.map(rate => (
                <tr key={rate.id}>
                  <td className="px-4 py-3">{rate.weight_min_kg} - {rate.weight_max_kg || 'up'} kg</td>
                  <td className="px-4 py-3">{rate.rate_type}</td>
                  <td className="px-4 py-3">{rate.rate_type === 'per_kg' ? rate.rate_per_kg?.toLocaleString() : rate.flat_rate?.toLocaleString()}</td>
                  <td className="px-4 py-3">{rate.currency}</td>
                  <td className="px-4 py-3">{new Date(rate.effective_from).toLocaleDateString()}</td>
                  <td className="px-4 py-3 flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleDeactivate(rate.id)}><Archive className="w-4 h-4" /></Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(rate.id)}><Trash2 className="w-4 h-4" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {historyRates.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-slate-500">Rate History</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm text-left text-slate-500">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 font-medium">Weight Range</th>
                  <th className="px-4 py-2 font-medium">Amount</th>
                  <th className="px-4 py-2 font-medium">Effective To</th>
                  <th className="px-4 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historyRates.map(rate => (
                  <tr key={rate.id}>
                    <td className="px-4 py-2">{rate.weight_min_kg} - {rate.weight_max_kg || 'up'} kg</td>
                    <td className="px-4 py-2">{rate.rate_type === 'per_kg' ? rate.rate_per_kg : rate.flat_rate} {rate.currency}</td>
                    <td className="px-4 py-2">{rate.effective_to ? new Date(rate.effective_to).toLocaleDateString() : 'N/A'}</td>
                    <td className="px-4 py-2">
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(rate.id)}><Trash2 className="w-4 h-4 text-red-400" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
`,

  'admin/shipping/settings/page.tsx': `"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    const res = await fetch('/api/admin/shipping/settings');
    const data = await res.json();
    setSettings(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateSetting = async (key: string, value: any) => {
    await fetch('/api/admin/shipping/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: value })
    });
    setSettings({ ...settings, [key]: value });
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Shipping Settings</h1>

      {settings.formulaStatus === 'PENDING_CONFIRMATION' && (
        <div className="bg-amber-100 border-l-4 border-amber-500 p-4 rounded-md">
          <p className="font-bold text-amber-900">While formula status is PENDING CONFIRMATION, all customer-facing shipping shows as Estimated DDP Shipping</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            Formula Status
            {settings.formulaStatus === 'CONFIRMED' ? 
              <span className="flex items-center text-sm text-green-600 bg-green-50 px-2 py-1 rounded"><CheckCircle2 className="w-4 h-4 mr-1"/> CONFIRMED</span> :
              <span className="flex items-center text-sm text-amber-600 bg-amber-50 px-2 py-1 rounded"><AlertTriangle className="w-4 h-4 mr-1"/> PENDING</span>
            }
          </CardTitle>
          <CardDescription>Status of supplier DDP calculation formulas</CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            variant={settings.formulaStatus === 'CONFIRMED' ? "outline" : "default"}
            onClick={() => updateSetting('formulaStatus', settings.formulaStatus === 'CONFIRMED' ? 'PENDING_CONFIRMATION' : 'CONFIRMED')}
          >
            {settings.formulaStatus === 'CONFIRMED' ? 'Mark as Pending' : 'Mark as Confirmed'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Volumetric Divisor</CardTitle>
          <CardDescription>Do not enter a divisor unless the supplier has explicitly confirmed it.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 max-w-sm">
            <Input 
              type="number" 
              value={settings.volumetricDivisor || ''} 
              onChange={e => setSettings({...settings, volumetricDivisor: e.target.value ? Number(e.target.value) : null})}
              placeholder="e.g. 5000 or 6000"
            />
            <Button onClick={() => updateSetting('volumetricDivisor', settings.volumetricDivisor)}>Save Divisor</Button>
          </div>
          {settings.divisorStatus === 'PENDING_CONFIRMATION' && (
            <Button variant="secondary" onClick={() => updateSetting('divisorStatus', 'CONFIRMED')}>
              Mark as Confirmed by Supplier
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Shipping Markup</CardTitle>
          <CardDescription>ICONJ markup on top of supplier DDP cost. Applied to all products globally.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 max-w-sm">
            <div className="relative w-full">
              <Input 
                type="number" 
                value={settings.markupPct || 0} 
                onChange={e => setSettings({...settings, markupPct: Number(e.target.value)})}
              />
              <span className="absolute right-3 top-2 text-slate-500">%</span>
            </div>
            <Button onClick={() => updateSetting('markupPct', settings.markupPct)}>Save</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Chargeable Weight Method</CardTitle>
          <CardDescription>How to calculate final chargeable weight</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 max-w-sm">
            <Select 
              value={settings.chargeableWeightMethod || 'MAX'} 
              onValueChange={v => updateSetting('chargeableWeightMethod', v)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="MAX">MAX (Actual vs Volumetric)</SelectItem>
                <SelectItem value="ACTUAL_ONLY">ACTUAL_ONLY (Ignore Volumetric)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
`,

  'admin/shipping/missing-data/page.tsx': `"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Edit2 } from "lucide-react";

export default function MissingDataPage() {
  const [data, setData] = useState<{ products: any[], summary: any }>({ products: [], summary: {} });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const res = await fetch('/api/admin/shipping/missing-data');
    const json = await res.json();
    setData(json);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Products Missing Shipping Data</h1>
        <Link href="/admin/shipping/bulk-update">
          <Button>Bulk Update</Button>
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {Object.entries(data.summary).map(([status, count]) => (
          <Card key={status}>
            <CardHeader className="py-3"><CardTitle className="text-sm text-slate-500">{status}</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{count as number}</div></CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">SKU</th>
                  <th className="px-4 py-3 font-medium">Weight (kg)</th>
                  <th className="px-4 py-3 font-medium">Dimensions (L×W×H)</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.products.map(p => (
                  <tr key={p.id}>
                    <td className="px-4 py-3">{p.name}</td>
                    <td className="px-4 py-3 text-slate-500">{p.sku || 'N/A'}</td>
                    <td className="px-4 py-3">{p.shipping_weight_kg || '-'}</td>
                    <td className="px-4 py-3">{p.shipping_length_cm ? \`\${p.shipping_length_cm} × \${p.shipping_width_cm} × \${p.shipping_height_cm}\` : '-'}</td>
                    <td className="px-4 py-3">
                      <span className={\`px-2 py-1 rounded text-xs \${p.shipping_data_status === 'MISSING' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}\`}>
                        {p.shipping_data_status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={\`/admin/products/\${p.id}\`}>
                        <Button variant="ghost" size="sm"><Edit2 className="w-4 h-4" /></Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
`,

  'admin/shipping/bulk-update/page.tsx': `"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";

export default function BulkUpdatePage() {
  const [productIds, setProductIds] = useState("");
  const [formData, setFormData] = useState({
    shipping_weight_kg: '',
    shipping_length_cm: '',
    shipping_width_cm: '',
    shipping_height_cm: ''
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleUpdate = async () => {
    setLoading(true);
    const ids = productIds.split(/[\\n,]+/).map(id => id.trim()).filter(id => id.length > 0);
    
    if (ids.length === 0) {
      alert("Please enter at least one Product ID");
      setLoading(false);
      return;
    }

    const updates = ids.map(id => {
      const update: any = { product_id: id };
      if (formData.shipping_weight_kg) update.shipping_weight_kg = parseFloat(formData.shipping_weight_kg);
      if (formData.shipping_length_cm) update.shipping_length_cm = parseFloat(formData.shipping_length_cm);
      if (formData.shipping_width_cm) update.shipping_width_cm = parseFloat(formData.shipping_width_cm);
      if (formData.shipping_height_cm) update.shipping_height_cm = parseFloat(formData.shipping_height_cm);
      return update;
    });

    const res = await fetch('/api/admin/shipping/bulk-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates })
    });

    const result = await res.json();
    if (result.error) {
      alert(result.error);
    } else {
      alert(\`Updated \${result.successCount} products successfully.\`);
      router.push('/admin/shipping/missing-data');
    }
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Bulk Update Shipping Data</h1>

      <Card>
        <CardHeader><CardTitle>Apply identical data to multiple products</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Product IDs (comma or newline separated)</Label>
            <Textarea 
              rows={5} 
              placeholder="uuid1&#10;uuid2&#10;uuid3"
              value={productIds}
              onChange={e => setProductIds(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Weight (kg)</Label>
              <Input type="number" step="0.01" value={formData.shipping_weight_kg} onChange={e => setFormData({...formData, shipping_weight_kg: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Length (cm)</Label>
              <Input type="number" step="0.1" value={formData.shipping_length_cm} onChange={e => setFormData({...formData, shipping_length_cm: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Width (cm)</Label>
              <Input type="number" step="0.1" value={formData.shipping_width_cm} onChange={e => setFormData({...formData, shipping_width_cm: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Height (cm)</Label>
              <Input type="number" step="0.1" value={formData.shipping_height_cm} onChange={e => setFormData({...formData, shipping_height_cm: e.target.value})} />
            </div>
          </div>

          <Button onClick={handleUpdate} disabled={loading}>
            {loading ? 'Updating...' : 'Apply Bulk Update'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
`
};

for (const [relPath, content] of Object.entries(files)) {
  const fullPath = path.join(rootDir, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content);
  console.log(\`Created \${fullPath}\`);
}
