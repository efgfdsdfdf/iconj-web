'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NewReferralPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', referral_code: '', commission_type: 'percentage', commission_value: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.referral_code || !form.commission_value) return toast.error('Required fields missing');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success('Referral Partner Created');
      router.push('/admin/marketing/referrals');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4 md:p-8">
      <Link href="/admin/marketing/referrals"><Button variant="ghost" className="mb-4"><ArrowLeft className="w-4 h-4 mr-2"/> Back</Button></Link>
      <h1 className="text-2xl font-bold mb-6">Add Referral Partner</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div><Label>Partner Name</Label><Input required value={form.name} onChange={e=>setForm({...form, name: e.target.value})} /></div>
        <div><Label>Partner Email (optional)</Label><Input type="email" value={form.email} onChange={e=>setForm({...form, email: e.target.value})} /></div>
        <div><Label>Unique Referral Code</Label><Input required value={form.referral_code} onChange={e=>setForm({...form, referral_code: e.target.value.toUpperCase()})} placeholder="e.g. JOHN20" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Commission Type</Label><select className="w-full border p-2 rounded" value={form.commission_type} onChange={e=>setForm({...form, commission_type: e.target.value})}><option value="percentage">Percentage (%)</option><option value="fixed">Fixed Amount (₦)</option></select></div>
          <div><Label>Commission Value</Label><Input required type="number" value={form.commission_value} onChange={e=>setForm({...form, commission_value: e.target.value})} placeholder="e.g. 10" /></div>
        </div>
        <Button type="submit" disabled={loading} className="w-full mt-4 bg-teal-600 hover:bg-teal-700">Add Partner</Button>
      </form>
    </div>
  );
}
