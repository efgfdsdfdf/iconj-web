import { requireAdmin, createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Ticket, Plus, Tag } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Coupons & Discounts | ICONJ Admin" };

export default async function CouponsPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: coupons } = await supabase
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Coupons & Discounts</h1>
          <p className="text-slate-500 mt-1">Manage promotional codes and special offers.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/marketing"><Button variant="outline">Back to Marketing</Button></Link>
          <Link href="/admin/marketing/coupons/new">
            <Button className="bg-orange-500 hover:bg-orange-600 flex items-center gap-2">
              <Plus className="w-4 h-4" /> Create Coupon
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {coupons?.map((coupon) => (
          <Card key={coupon.id} className="relative group hover:border-orange-300 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {coupon.is_active ? (
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Active</span>
                    ) : (
                      <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">Inactive</span>
                    )}
                  </div>
                  <CardTitle className="text-lg font-mono text-orange-600 uppercase tracking-widest">{coupon.code}</CardTitle>
                  <CardDescription className="mt-1">{coupon.description || 'No description'}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2 mt-2">
                <div className="text-sm font-bold text-slate-900">
                  {coupon.discount_type === 'percentage' ? `${coupon.discount_value}% OFF` : 
                   coupon.discount_type === 'fixed_amount' ? `₦${Number(coupon.discount_value).toLocaleString()} OFF` : 
                   'FREE SHIPPING'}
                </div>
                <div className="text-xs text-slate-500">
                  {coupon.min_order_amount ? `Min spend: ₦${Number(coupon.min_order_amount).toLocaleString()}` : 'No minimum spend'}
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <span className="text-xs text-slate-500 font-medium">Used: {coupon.times_used} {coupon.usage_limit ? `/ ${coupon.usage_limit}` : 'times'}</span>
                <Button variant="ghost" size="sm" className="h-8 text-orange-600 hover:text-orange-700 hover:bg-orange-50">Edit</Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {(!coupons || coupons.length === 0) && (
          <div className="col-span-full p-12 text-center bg-slate-50 border border-dashed rounded-lg text-slate-500">
            <Ticket className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900">No coupons active</h3>
            <p className="mt-2 mb-6">Create discount codes to incentivize purchases and reward loyalty.</p>
            <Button className="bg-orange-500 hover:bg-orange-600">Create first coupon</Button>
          </div>
        )}
      </div>
    </div>
  );
}
