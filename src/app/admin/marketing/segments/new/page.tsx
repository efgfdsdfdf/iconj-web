'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NewSegmentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', field: 'total_spent', operator: '>', value: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.value) return toast.error('Required fields missing');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/segments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          filter_rules: [{ field: form.field, operator: form.operator, value: form.value }]
        })
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success('Segment Created');
      router.push('/admin/marketing/segments');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4 md:p-8">
      <Link href="/admin/marketing/segments"><Button variant="ghost" className="mb-4"><ArrowLeft className="w-4 h-4 mr-2"/> Back</Button></Link>
      <h1 className="text-2xl font-bold mb-6">Create Segment</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div><Label>Name</Label><Input required value={form.name} onChange={e=>setForm({...form, name: e.target.value})} /></div>
        <div><Label>Description</Label><Textarea value={form.description} onChange={e=>setForm({...form, description: e.target.value})} /></div>
        <div className="grid grid-cols-3 gap-2">
          <div><Label>Field</Label><select className="w-full border p-2 rounded" value={form.field} onChange={e=>setForm({...form, field: e.target.value})}><option value="total_spent">Total Spent</option><option value="order_count">Order Count</option></select></div>
          <div><Label>Operator</Label><select className="w-full border p-2 rounded" value={form.operator} onChange={e=>setForm({...form, operator: e.target.value})}><option value=">">Greater Than</option><option value="<">Less Than</option></select></div>
          <div><Label>Value</Label><Input required type="number" value={form.value} onChange={e=>setForm({...form, value: e.target.value})} /></div>
        </div>
        <Button type="submit" disabled={loading} className="w-full mt-4">Create Segment</Button>
      </form>
    </div>
  );
}
