import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

export const revalidate = 0;

export default async function CustomerIssues() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const supabaseAdmin = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  // Attempt to fetch issues. By using admin client, we bypass RLS.
  const { data: issues, error } = await supabaseAdmin
    .from("order_issues")
    .select("*, orders(created_at, total_amount)")
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });

  const getStatusColor = (status: string) => {
    switch(status) {
      case "Submitted": return "bg-blue-100 text-blue-800 border-blue-200";
      case "Under Review": return "bg-amber-100 text-amber-800 border-amber-200";
      case "Contacting Supplier": return "bg-purple-100 text-purple-800 border-purple-200";
      case "Resolved": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "Rejected": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  return (
    <Card className="border-none shadow-sm h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between border-b pb-4 bg-slate-50">
        <div>
          <CardTitle className="text-xl text-slate-900 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-500" /> My Reported Issues
          </CardTitle>
          <p className="text-sm text-slate-500 mt-1">Track the status of your complaints and replacements.</p>
        </div>
        <Link href="/report-issue">
          <Button className="bg-orange-500 hover:bg-orange-600 gap-2">
            <Plus className="w-4 h-4" /> Report Issue
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        {error && error.code === "42P01" ? (
          <div className="p-8 text-center">
            <h3 className="text-lg font-bold text-slate-900">Database Setup Required</h3>
            <p className="text-slate-500 mb-6">The issue tracking system is currently being set up. Please try again later.</p>
          </div>
        ) : !issues || issues.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center h-full min-h-[300px]">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center shadow-sm mb-4">
              <AlertCircle className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No reported issues</h3>
            <p className="text-slate-500 max-w-sm mt-1 mb-6">You haven't reported any issues with your orders yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {issues.map(issue => (
              <div key={issue.id} className="p-6 hover:bg-slate-50 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div>
                    <h4 className="font-bold text-slate-900 flex items-center gap-2">
                      Order #{issue.order_id.substring(0,8).toUpperCase()}
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusColor(issue.status)}`}>
                        {issue.status}
                      </span>
                    </h4>
                    <p className="text-sm text-slate-500 mt-1">Reported: {new Date(issue.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className="text-sm font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded">Ref: {issue.id.substring(0,8).toUpperCase()}</span>
                </div>
                
                <div className="bg-white border rounded-lg p-4 mb-4">
                  <p className="text-sm font-bold text-slate-900 mb-1">Issue: {issue.issue_type}</p>
                  <p className="text-sm text-slate-600 line-clamp-2">{issue.description}</p>
                </div>

                {issue.admin_notes && (
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mt-2">
                    <p className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-1">ICONJ Response</p>
                    <p className="text-sm text-blue-900">{issue.admin_notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

