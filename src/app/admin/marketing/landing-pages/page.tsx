import { requireAdmin, createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LayoutTemplate, Plus, ExternalLink, Activity } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Ad Landing Pages | ICONJ Admin" };

export default async function LandingPagesAdmin() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: pages } = await supabase
    .from('landing_pages')
    .select('*, product:product_id(name)')
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Ad Landing Pages</h1>
          <p className="text-slate-500 mt-1">Standalone conversion-optimized pages for paid campaigns.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/marketing"><Button variant="outline">Back to Marketing</Button></Link>
          <Link href="/admin/marketing/landing-pages/new">
            <Button className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2">
              <Plus className="w-4 h-4" /> Create Page
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pages?.map((page) => (
          <Card key={page.id} className="relative group hover:border-indigo-300 transition-colors flex flex-col overflow-hidden">
            <div className="h-24 bg-slate-100 relative" style={{ backgroundColor: page.theme_color ? `${page.theme_color}20` : '#f1f5f9' }}>
              {page.hero_image_url && <img src={page.hero_image_url} alt="" className="w-full h-full object-cover opacity-60 mix-blend-multiply" />}
              <div className="absolute top-3 right-3 flex gap-2">
                {page.is_active ? (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded shadow-sm flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> LIVE
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded shadow-sm">DRAFT</span>
                )}
              </div>
            </div>
            
            <CardHeader className="pb-2">
              <CardTitle className="text-lg leading-tight">{page.title}</CardTitle>
              <CardDescription className="text-xs text-indigo-600 font-mono mt-1">/lp/{page.slug}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between pt-2">
              <div className="text-sm text-slate-600 mb-6 line-clamp-2">
                {page.headline}
              </div>
              
              <div className="flex items-center gap-2 pt-4 border-t">
                <Link href={`/lp/${page.slug}`} target="_blank" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full text-slate-600">
                    <ExternalLink className="w-4 h-4 mr-2" /> View
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" className="px-3 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                  Edit
                </Button>
                <Button variant="ghost" size="sm" className="px-3 text-slate-400 hover:text-slate-600" title="Analytics coming soon">
                  <Activity className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {(!pages || pages.length === 0) && (
          <div className="col-span-full p-12 text-center bg-slate-50 border border-dashed rounded-lg text-slate-500">
            <LayoutTemplate className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900">No landing pages built</h3>
            <p className="mt-2 mb-6">Create focused destination pages for your Instagram and Facebook ads to increase conversion rates.</p>
            <Button className="bg-indigo-600 hover:bg-indigo-700">Create your first landing page</Button>
          </div>
        )}
      </div>
    </div>
  );
}
