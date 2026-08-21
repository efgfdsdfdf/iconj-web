import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, User, Package, Calendar, Image as ImageIcon } from "lucide-react";
import { IssueStatusForm } from "./IssueStatusForm";

export const revalidate = 0;

export default async function AdminIssueDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  
  const { data: issue } = await supabase
    .from("order_issues")
    .select("*, profiles(name, email, phone), orders(total_amount, shipping_address)")
    .eq("id", id)
    .single();

  if (!issue) notFound();

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <Link href="/admin/issues" className="text-slate-500 hover:text-blue-600 flex items-center mb-4 text-sm font-medium">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Issues
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              Issue Report
              <Badge variant="outline" className={
                issue.status === "Submitted" ? "bg-blue-50 text-blue-700 border-blue-200" :
                issue.status === "Resolved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                "bg-amber-50 text-amber-700 border-amber-200"
              }>{issue.status}</Badge>
            </h1>
            <p className="text-slate-500 font-mono mt-1">Ref: {issue.id}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="bg-slate-50 border-b pb-4">
              <CardTitle className="text-lg">Issue Details: {issue.issue_type}</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-slate-700 whitespace-pre-wrap">{issue.description}</p>
              
              {issue.evidence_urls && issue.evidence_urls.length > 0 && (
                <div className="mt-8 pt-6 border-t">
                  <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" /> Customer Evidence
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {issue.evidence_urls.map((url: string, i: number) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block rounded-lg overflow-hidden border hover:border-blue-500 hover:shadow-md transition-all">
                        <img src={url} alt={`Evidence ${i+1}`} className="w-full h-32 object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <IssueStatusForm issue={issue} />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><User className="w-4 h-4"/> Customer Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-slate-500">Name</p>
                <p className="font-bold text-slate-900">{issue.profiles?.name || "N/A"}</p>
              </div>
              <div>
                <p className="text-slate-500">Email</p>
                <p className="font-medium text-slate-900">{issue.profiles?.email}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Package className="w-4 h-4"/> Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-slate-500">Order ID</p>
                <Link href={`/admin/orders/${issue.order_id}`} className="font-mono text-blue-600 hover:underline">{issue.order_id.substring(0,8).toUpperCase()}</Link>
              </div>
              <div>
                <p className="text-slate-500">Reported On</p>
                <p className="font-medium text-slate-900">{new Date(issue.created_at).toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

