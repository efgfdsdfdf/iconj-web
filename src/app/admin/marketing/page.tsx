import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, BarChart3, Users, Workflow, Handshake, Ticket, LayoutTemplate } from "lucide-react";

const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Africa/Lagos',
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(d);
  } catch (e) {
    return '-';
  }
};

export default async function MarketingDashboard() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: campaigns, error } = await supabase
    .from("email_campaigns")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return <div>Error loading campaigns: {error.message}</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Marketing Campaigns</h1>
          <p className="text-slate-600">Schedule seasonal broadcasts and email blasts.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 mt-4 md:mt-0">
          <Link href="/admin/marketing/analytics">
            <Button variant="outline" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> Analytics Dashboard
            </Button>
          </Link>
          <Link href="/admin/marketing/segments">
            <Button variant="outline" className="flex items-center gap-2">
              <Users className="w-4 h-4" /> Segments
            </Button>
          </Link>
          <Link href="/admin/marketing/automations">
            <Button variant="outline" className="flex items-center gap-2 text-purple-600 hover:text-purple-700">
              <Workflow className="w-4 h-4" /> Automations
            </Button>
          </Link>
          <Link href="/admin/marketing/referrals">
            <Button variant="outline" className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700">
              <Handshake className="w-4 h-4" /> Referrals
            </Button>
          </Link>
          <Link href="/admin/marketing/coupons">
            <Button variant="outline" className="flex items-center gap-2 text-amber-600 hover:text-amber-700">
              <Ticket className="w-4 h-4" /> Coupons
            </Button>
          </Link>
          <Link href="/admin/marketing/landing-pages">
            <Button variant="outline" className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700">
              <LayoutTemplate className="w-4 h-4" /> Landing Pages
            </Button>
          </Link>
          <Link href="/admin/marketing/new">
            <Button className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700">
              <Plus className="w-4 h-4" /> New Campaign
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 text-sm">
              <th className="p-4 font-medium">Campaign Title</th>
              <th className="p-4 font-medium">Target Audience</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Scheduled For</th>
              <th className="p-4 font-medium">Sent At</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {!campaigns || campaigns.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">
                  No marketing campaigns found. Create your first one!
                </td>
              </tr>
            ) : (
              campaigns.map((camp: any) => (
                <tr key={camp.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-4 font-medium text-slate-900">{camp.title}</td>
                  <td className="p-4 text-sm text-slate-600">{camp.target_audience}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      camp.status === 'SENT' ? 'bg-green-100 text-green-700' :
                      camp.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {camp.status}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-slate-600">
                    {formatDate(camp.scheduled_for)}
                  </td>
                  <td className="p-4 text-sm text-slate-600">
                    {formatDate(camp.sent_at)}
                  </td>
                  <td className="p-4 text-right">
                    <Link href={`/admin/marketing/${camp.id}/edit`} className="text-blue-600 hover:underline text-sm font-medium">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
