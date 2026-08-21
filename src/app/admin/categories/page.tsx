import { createClient } from "@/lib/supabase/server";
import { CategoryEditorClient } from "./CategoryEditorClient";
import { AlertCircle } from "lucide-react";

export const revalidate = 0;

export default async function AdminCategories() {
  const supabase = await createClient();
  
  const { data: settings, error } = await supabase
    .from("store_settings")
    .select("value")
    .eq("id", "homepage_categories")
    .single();

  if (error && error.code === "42P01") {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center mt-12 bg-white rounded-xl border shadow-sm">
        <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Database Setup Required</h2>
        <p className="text-slate-600 mb-6">You need to run the setup SQL script in your Supabase dashboard to create the store_settings table before you can edit categories.</p>
      </div>
    );
  }

  const initialCategories = settings?.value || [
    {"name": "Smart Motorized Blinds", "icon": "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=200&q=80"},
    {"name": "Blackout Shades", "icon": "https://images.unsplash.com/photo-1615873968403-89e068629265?w=200&q=80"},
    {"name": "Curtain Tracks", "icon": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=200&q=80"}
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Homepage Categories</h1>
        <p className="text-slate-500">Edit the quick category links that appear at the top of the homepage.</p>
      </div>

      <CategoryEditorClient initialCategories={initialCategories} />
    </div>
  );
}

