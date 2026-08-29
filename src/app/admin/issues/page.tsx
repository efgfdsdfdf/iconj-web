import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { AlertCircle, ExternalLink, Image as ImageIcon } from "lucide-react";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export const revalidate = 0;

export default async function AdminIssues() {
  const supabaseAdmin = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  const { data: issues, error } = await supabaseAdmin
    .from("order_issues")
    .select("*, profiles(name, email), orders(total_amount)")
    .order("created_at", { ascending: false });

  if (error && error.code === "42P01") {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center mt-12 bg-white rounded-xl border shadow-sm">
        <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Database Setup Required</h2>
        <p className="text-slate-600 mb-6">You need to run the setup SQL script in your Supabase dashboard to create the order_issues table before this CRM will work.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Order Issues CRM</h1>
        <p className="text-slate-500">Manage customer reports, damages, and replacement requests.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b">
                <tr>
                  <th className="px-6 py-4">Reference</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Issue Type</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {issues?.map(issue => (
                  <tr key={issue.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-mono font-bold">{issue.id.substring(0,8).toUpperCase()}</td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{issue.profiles?.name || "Unknown"}</p>
                      <p className="text-slate-500 text-xs">{issue.profiles?.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/admin/orders/${issue.order_id}`} className="text-blue-600 hover:underline flex items-center gap-1 font-mono">
                        {issue.order_id.substring(0,8).toUpperCase()} <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">{issue.issue_type}</p>
                      {issue.evidence_urls && issue.evidence_urls.length > 0 && (
                        <p className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                          <ImageIcon className="w-3 h-3"/> {issue.evidence_urls.length} attachments
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={
                        issue.status === "Submitted" ? "bg-blue-50 text-blue-700 border-blue-200" :
                        issue.status === "Resolved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        "bg-amber-50 text-amber-700 border-amber-200"
                      }>{issue.status}</Badge>
                    </td>
                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                      {new Date(issue.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/admin/issues/${issue.id}`} className="text-blue-600 font-medium hover:underline">
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
                {(!issues || issues.length === 0) && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      No issues reported yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

