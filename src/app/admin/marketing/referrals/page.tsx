import { requireAdmin, createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Handshake, Plus, ArrowUpRight, DollarSign, Users } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Referral Partners | ICONJ Admin" };

export default async function ReferralsPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: partners, error } = await supabase
    .from('referral_partners')
    .select(`
      *,
      profiles:user_id ( email, name )
    `)
    .order('total_earned', { ascending: false });

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Referral Partners</h1>
          <p className="text-slate-500 mt-1">Manage affiliates, influencers, and their commissions.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/marketing"><Button variant="outline">Back to Marketing</Button></Link>
          <Button className="bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Partner
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {partners?.map((partner) => (
          <Card key={partner.id} className="relative group hover:border-emerald-300 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase tracking-wider border border-slate-200">
                      {partner.partner_type}
                    </span>
                    {partner.is_active && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    )}
                  </div>
                  <CardTitle className="text-lg">{partner.profiles?.name || 'Unknown'}</CardTitle>
                  <CardDescription className="mt-1 font-mono text-emerald-600 font-medium">Code: {partner.referral_code}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mt-4 border-t pt-4">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 font-medium uppercase tracking-wider flex items-center gap-1"><Users className="w-3 h-3"/> Referrals</span>
                  <span className="text-xl font-bold text-slate-900">{partner.total_referrals}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 font-medium uppercase tracking-wider flex items-center gap-1"><DollarSign className="w-3 h-3"/> Earned</span>
                  <span className="text-xl font-bold text-slate-900">₦{Number(partner.total_earned).toLocaleString()}</span>
                </div>
              </div>
              <div className="text-xs text-slate-500 mt-4 bg-slate-50 p-2 rounded">
                Commission: {partner.commission_type === 'percentage' ? `${partner.commission_value}%` : `₦${partner.commission_value}`}
              </div>
              <Button variant="ghost" className="w-full mt-4 justify-between group-hover:bg-emerald-50 group-hover:text-emerald-700">
                View Performance <ArrowUpRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        ))}

        {(!partners || partners.length === 0) && (
          <div className="col-span-full p-12 text-center bg-slate-50 border border-dashed rounded-lg text-slate-500">
            <Handshake className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900">No active partners</h3>
            <p className="mt-2 mb-6">Create affiliate links for influencers and partners to track sales.</p>
            <Button className="bg-emerald-600 hover:bg-emerald-700">Create first partner</Button>
          </div>
        )}
      </div>
    </div>
  );
}
