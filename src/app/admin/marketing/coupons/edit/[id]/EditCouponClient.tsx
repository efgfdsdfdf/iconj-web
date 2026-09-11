'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, Shuffle } from 'lucide-react';
import toast from 'react-hot-toast';
import { updateCoupon } from '../../../actions';

export function EditCouponClient({ coupon }: { coupon: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    code: coupon.code,
    discount_type: coupon.discount_type,
    discount_value: coupon.discount_value,
    min_order_amount: coupon.min_order_amount || '',
    usage_limit: coupon.usage_limit || '',
    end_date: coupon.end_date ? new Date(coupon.end_date).toISOString().split('T')[0] : '',
    is_active: coupon.is_active
  });

  const set = (field: string, value: any) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || !form.discount_value) {
      toast.error('Code and discount value are required');
      return;
    }
    setLoading(true);
    try {
      await updateCoupon(coupon.id, {
          code: form.code.toUpperCase(),
          discount_type: form.discount_type,
          discount_value: Number(form.discount_value),
          min_order_amount: form.min_order_amount ? Number(form.min_order_amount) : null,
          usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
          end_date: form.end_date || null,
          is_active: form.is_active
      });
      toast.success('Coupon updated!');
      router.push('/admin/marketing/coupons');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/marketing/coupons">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Edit Coupon</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-xl border p-6 shadow-sm">
        <div className="space-y-2">
          <Label htmlFor="code">Coupon Code</Label>
          <Input id="code" value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} className="font-mono" />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Discount Type</Label>
            <select className="w-full border p-2 rounded" value={form.discount_type} onChange={e => set('discount_type', e.target.value)}>
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Value</Label>
            <Input type="number" value={form.discount_value} onChange={e => set('discount_value', e.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Minimum Order Amount</Label>
          <Input type="number" value={form.min_order_amount} onChange={e => set('min_order_amount', e.target.value)} />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Max Uses</Label>
            <Input type="number" value={form.usage_limit} onChange={e => set('usage_limit', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Expiry Date</Label>
            <Input type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)} />
          </div>
        </div>
        
        <div className="flex items-center gap-2 mt-4">
           <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} id="active" />
           <Label htmlFor="active">Is Active?</Label>
        </div>

        <div className="flex items-center gap-3 pt-4 border-t">
          <Button type="submit" disabled={loading} className="gap-2 bg-amber-600 hover:bg-amber-700">
            {loading ? 'Saving...' : 'Save Coupon'}
          </Button>
        </div>
      </form>
    </div>
  );
}
