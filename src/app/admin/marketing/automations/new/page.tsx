'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NewAutomationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', trigger_event: 'abandoned_cart', delay_hours: '2', subject: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.subject) return toast.error('Required fields missing');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          trigger_event: form.trigger_event,
          steps: [
            { type: 'wait', value: Number(form.delay_hours), unit: 'hours' },
            { type: 'email', subject: form.subject, template: 'abandoned_cart_reminder' }
          ]
        })
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success('Automation Flow Created');
      router.push('/admin/marketing/automations');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4 md:p-8">
      <Link href="/admin/marketing/automations"><Button variant="ghost" className="mb-4"><ArrowLeft className="w-4 h-4 mr-2"/> Back</Button></Link>
      <h1 className="text-2xl font-bold mb-6">Create Automation Flow</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div><Label>Flow Name</Label><Input required value={form.name} onChange={e=>setForm({...form, name: e.target.value})} placeholder="e.g. Abandoned Cart Recovery" /></div>
        <div><Label>Trigger Event</Label><select className="w-full border p-2 rounded" value={form.trigger_event} onChange={e=>setForm({...form, trigger_event: e.target.value})}><option value="abandoned_cart">Abandoned Cart</option><option value="new_signup">New Signup</option></select></div>
        <div><Label>Wait time (Hours)</Label><Input required type="number" value={form.delay_hours} onChange={e=>setForm({...form, delay_hours: e.target.value})} /></div>
        <div><Label>Email Subject Line</Label><Input required value={form.subject} onChange={e=>setForm({...form, subject: e.target.value})} placeholder="e.g. Did you forget something?" /></div>
        <Button type="submit" disabled={loading} className="w-full mt-4">Create Flow</Button>
      </form>
    </div>
  );
}
