import { requireAdmin, createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { EditLandingPageClient } from "./EditLandingPageClient";

export default async function EditLandingPagePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const resolvedParams = await params;
  const supabase = await createClient();
  
  const { data: page, error } = await supabase
    .from('landing_pages')
    .select('*')
    .eq('id', resolvedParams.id)
    .single();

  if (error || !page) return notFound();

  return <EditLandingPageClient page={page} />;
}
