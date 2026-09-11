"use client";

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
    await fetch(`/api/admin/shipping/rates/${id}`, { method: 'PATCH' });
    fetchRates();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this rate permanently?')) return;
    const res = await fetch(`/api/admin/shipping/rates/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.error) alert(data.error);
    else fetchRates();
  };

  const activeRates = rates.filter(r => r.is_active);
  const historyRates = rates.filter(r => !r.is_active);

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
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
          <div className="overflow-x-auto"><table className="w-full text-sm text-left min-w-[600px]">
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
          </table></div>
        </CardContent>
      </Card>

      {historyRates.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-slate-500">Rate History</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto"><table className="w-full text-sm text-left text-slate-500 min-w-[600px]">
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
            </table></div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
