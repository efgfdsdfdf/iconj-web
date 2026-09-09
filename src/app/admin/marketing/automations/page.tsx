import { requireAdmin, createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Workflow, Plus, Play, Pause, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Automations | ICONJ Admin" };

export default async function AutomationsPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: flows, error } = await supabase
    .from('automation_flows')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Automation Flows</h1>
          <p className="text-slate-500 mt-1">Manage trigger-based campaigns like abandoned cart and win-back emails.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/marketing"><Button variant="outline">Back to Marketing</Button></Link>
          <Button className="bg-purple-600 hover:bg-purple-700 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create Flow
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {flows?.map((flow) => (
          <Card key={flow.id} className="relative group hover:border-purple-300 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {flow.is_active ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-wider border border-emerald-200">
                        <Play className="w-3 h-3" /> Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase tracking-wider border border-slate-200">
                        <Pause className="w-3 h-3" /> Paused
                      </span>
                    )}
                    <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      Trigger: {flow.trigger_event}
                    </span>
                  </div>
                  <CardTitle className="text-lg">{flow.name}</CardTitle>
                  <CardDescription className="mt-1 line-clamp-2">{flow.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mt-4 border-t pt-4">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Enrolled</span>
                  <span className="text-xl font-bold text-slate-900">{flow.total_enrolled}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Completed</span>
                  <span className="text-xl font-bold text-slate-900">{flow.total_completed}</span>
                </div>
              </div>
              <Button variant="ghost" className="w-full mt-4 justify-between group-hover:bg-purple-50 group-hover:text-purple-700">
                Edit Flow <ArrowUpRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        ))}

        {(!flows || flows.length === 0) && (
          <div className="col-span-full p-12 text-center bg-slate-50 border border-dashed rounded-lg text-slate-500">
            <Workflow className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900">No automations running</h3>
            <p className="mt-2 mb-6">Set up automated sequences to recover carts and nurture leads on autopilot.</p>
            <Button className="bg-purple-600 hover:bg-purple-700">Browse Templates</Button>
          </div>
        )}
      </div>
    </div>
  );
}
