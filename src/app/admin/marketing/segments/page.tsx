import { requireAdmin, createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Filter, Plus, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { revalidatePath } from "next/cache";

export const metadata = { title: "Customer Segments | ICONJ Admin" };

export default async function SegmentsPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: segments, error } = await supabase
    .from('customer_segments')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Customer Segments</h1>
          <p className="text-slate-500 mt-1">Create dynamic audiences for targeted campaigns</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/marketing"><Button variant="outline">Back to Marketing</Button></Link>
          <Link href="/admin/marketing/segments/new"><Button className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"><Plus className="w-4 h-4" /> Create Segment</Button></Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {segments?.map((segment) => (
          <Card key={segment.id} className="relative group hover:border-blue-300 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{segment.name}</CardTitle>
                  <CardDescription className="mt-1 line-clamp-2">{segment.description || 'No description provided.'}</CardDescription>
                </div>
                <div className="bg-blue-50 text-blue-700 p-2 rounded-full">
                  <Users className="w-4 h-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mt-4 border-t pt-4">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Est. Audience</span>
                  <span className="text-xl font-bold text-slate-900">{segment.cached_count}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Filter className="w-4 h-4" /> {segment.filter_rules.length} rules
                </div>
              </div>
              <Button variant="ghost" className="w-full mt-4 justify-between group-hover:bg-blue-50 group-hover:text-blue-700">
                Edit Rules <ArrowUpRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        ))}

        {(!segments || segments.length === 0) && (
          <div className="col-span-full p-12 text-center bg-slate-50 border border-dashed rounded-lg text-slate-500">
            <Filter className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900">No segments created yet</h3>
            <p className="mt-2 mb-6">Group your customers by spending habits, visit frequency, and more.</p>
            <Button className="bg-blue-600 hover:bg-blue-700">Create your first segment</Button>
          </div>
        )}
      </div>
    </div>
  );
}
