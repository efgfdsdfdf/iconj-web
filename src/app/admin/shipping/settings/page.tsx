"use client";

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
