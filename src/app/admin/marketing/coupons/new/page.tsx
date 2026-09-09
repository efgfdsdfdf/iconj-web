'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, Shuffle } from 'lucide-react';
import toast from 'react-hot-toast';

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export default function NewCouponPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    code: generateCode(),
    discount_type: 'percentage',
    discount_value: '',
    min_order_amount: '',
    usage_limit: '',
    expires_at: '',
  });

  const set = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || !form.discount_value) {
      toast.error('Code and discount value are required');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: form.code.toUpperCase(),
          discount_type: form.discount_type,
          discount_value: Number(form.discount_value),
          min_order_amount: form.min_order_amount ? Number(form.min_order_amount) : null,
          usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
          expires_at: form.expires_at || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create coupon');
      toast.success(`Coupon "${form.code}" created!`);
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
          <h1 className="text-2xl font-extrabold text-slate-900">Create Coupon Code</h1>
          <p className="text-slate-500 text-sm mt-0.5">Share this code with customers at checkout for a discount.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-xl border p-6 shadow-sm">
        {/* Code */}
        <div className="space-y-2">
          <Label htmlFor="code">Coupon Code <span className="text-red-500">*</span></Label>
          <div className="flex gap-2">
            <Input
              id="code"
              placeholder="e.g. WELCOME10"
              value={form.code}
              onChange={e => set('code', e.target.value.toUpperCase())}
              className="font-mono text-lg tracking-widest font-bold"
            />
            <Button type="button" variant="outline" onClick={() => set('code', generateCode())} title="Generate random code">
              <Shuffle className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-slate-500">Customers type this exactly at checkout. Automatically uppercased.</p>
        </div>

        {/* Discount Type & Value */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Discount Type <span className="text-red-500">*</span></Label>
            <div className="flex border rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => set('discount_type', 'percentage')}
                className={`flex-1 py-2 text-sm font-bold transition-colors ${form.discount_type === 'percentage' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
              >
                % Percentage
              </button>
              <button
                type="button"
                onClick={() => set('discount_type', 'fixed')}
                className={`flex-1 py-2 text-sm font-bold transition-colors ${form.discount_type === 'fixed' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
              >
                ₦ Fixed Amount
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="discount_value">
              {form.discount_type === 'percentage' ? 'Percentage Off (%)' : 'Amount Off (₦)'} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="discount_value"
              type="number"
              min="1"
              max={form.discount_type === 'percentage' ? '100' : undefined}
              placeholder={form.discount_type === 'percentage' ? 'e.g. 10 (for 10% off)' : 'e.g. 5000 (for ₦5,000 off)'}
              value={form.discount_value}
              onChange={e => set('discount_value', e.target.value)}
            />
          </div>
        </div>

        {/* Minimum Order */}
        <div className="space-y-2">
          <Label htmlFor="min_order_amount">Minimum Order Amount (₦) — optional</Label>
          <Input
            id="min_order_amount"
            type="number"
            placeholder="e.g. 20000 — leave blank for no minimum"
            value={form.min_order_amount}
            onChange={e => set('min_order_amount', e.target.value)}
          />
        </div>

        {/* Usage Limit & Expiry */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="usage_limit">Max Uses — optional</Label>
            <Input
              id="usage_limit"
              type="number"
              placeholder="e.g. 100 — leave blank for unlimited"
              value={form.usage_limit}
              onChange={e => set('usage_limit', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expires_at">Expiry Date — optional</Label>
            <Input
              id="expires_at"
              type="date"
              value={form.expires_at}
              onChange={e => set('expires_at', e.target.value)}
            />
          </div>
        </div>

        {/* Preview */}
        {form.code && form.discount_value && (
          <div className="bg-slate-50 rounded-lg border border-dashed p-4 text-sm text-slate-600">
            <strong>Preview:</strong> Code <span className="font-mono font-bold text-blue-700">{form.code}</span> gives{' '}
            {form.discount_type === 'percentage' ? `${form.discount_value}% off` : `₦${Number(form.discount_value).toLocaleString()} off`}
            {form.min_order_amount ? ` on orders over ₦${Number(form.min_order_amount).toLocaleString()}` : ''}
            {form.expires_at ? ` — expires ${form.expires_at}` : ''}
            {form.usage_limit ? `, max ${form.usage_limit} uses` : ''}
          </div>
        )}

        <div className="flex items-center gap-3 pt-4 border-t">
          <Button type="submit" disabled={loading} className="gap-2 bg-amber-600 hover:bg-amber-700">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Creating...' : 'Create Coupon'}
          </Button>
          <Link href="/admin/marketing/coupons">
            <Button type="button" variant="ghost" className="text-slate-500">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
