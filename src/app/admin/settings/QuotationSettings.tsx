"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";

export function QuotationSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [settings, setSettings] = useState({
    default_markup_pct: "30",
    quote_validity_days: "7",
    payment_grace_hours: "24",
    quote_reminder_1_hours: "24",
    quote_reminder_2_days_before_expiry: "2"
  });

  useEffect(() => {
    fetch("/api/admin/settings")
      .then(res => res.json())
      .then(data => {
        if (data.settings) {
          setSettings(prev => ({ ...prev, ...data.settings }));
        }
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });
      alert("Settings saved successfully.");
    } catch (e) {
      alert("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Card><CardContent className="p-6 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-300" /></CardContent></Card>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quotation & Order Settings</CardTitle>
        <CardDescription>Configure pricing automation and workflow timers.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Default Pricing Markup (%)</Label>
            <Input 
              type="number" 
              value={settings.default_markup_pct} 
              onChange={e => setSettings({...settings, default_markup_pct: e.target.value})} 
            />
            <p className="text-xs text-slate-500">Automatically added to supplier cost when calculating customer price.</p>
          </div>
          <div className="space-y-2">
            <Label>Quotation Validity Period (Days)</Label>
            <Input 
              type="number" 
              value={settings.quote_validity_days} 
              onChange={e => setSettings({...settings, quote_validity_days: e.target.value})} 
            />
            <p className="text-xs text-slate-500">How long customer has to accept before it auto-expires.</p>
          </div>
          <div className="space-y-2">
            <Label>Payment Grace Period (Hours)</Label>
            <Input 
              type="number" 
              value={settings.payment_grace_hours} 
              onChange={e => setSettings({...settings, payment_grace_hours: e.target.value})} 
            />
            <p className="text-xs text-slate-500">Time allowed to complete payment after clicking "Accept" before quotation is revoked.</p>
          </div>
        </div>

        <div className="pt-4 border-t">
          <h4 className="text-sm font-semibold mb-4">Automated Reminders</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>First Reminder (Hours after sending)</Label>
              <Input 
                type="number" 
                value={settings.quote_reminder_1_hours} 
                onChange={e => setSettings({...settings, quote_reminder_1_hours: e.target.value})} 
              />
            </div>
            <div className="space-y-2">
              <Label>Final Reminder (Days before expiry)</Label>
              <Input 
                type="number" 
                value={settings.quote_reminder_2_days_before_expiry} 
                onChange={e => setSettings({...settings, quote_reminder_2_days_before_expiry: e.target.value})} 
              />
            </div>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <Save className="w-4 h-4 mr-2"/>} Save Settings
        </Button>
      </CardContent>
    </Card>
  );
}
