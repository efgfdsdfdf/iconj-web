import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function CategoriesPage() {
  const supabase = await createClient();
  
  // Fetch real categories and their custom admin uploaded images (if any)
  const { data: dbCategories } = await supabase.from("categories").select("*").order("created_at");
  const { data: settings } = await supabase.from("store_settings").select("value").eq("id", "homepage_categories").single();
  
  const adminCategories: { name: string, icon: string }[] = settings?.value || [];
  
  const categories = (dbCategories || []).map(cat => {
    const customMatch = adminCategories.find(ac => ac.name.toLowerCase().trim() === cat.name.toLowerCase().trim() || ac.name.toLowerCase().includes(cat.name.toLowerCase()));
    
    return {
      title: cat.name,
      id: cat.id,
      img: customMatch?.icon || 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=80',
      desc: `Explore our collection of premium ${cat.name.toLowerCase()}.`
    };
  });

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mb-12">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Shop by Category</h1>
        <p className="text-lg text-slate-600">Browse our carefully curated range of premium custom blinds, curtains, and window treatments designed for your home and office.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {categories.map((cat, i) => (
          <Link href={`/shop?category=${cat.id}`} key={i} className="group block">
            <Card className="overflow-hidden border-slate-200 transition-all hover:shadow-xl hover:-translate-y-1">
              <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
                <img src={cat.img} alt={cat.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                  <span className="text-white font-medium flex items-center gap-2">Explore Category &rarr;</span>
                </div>
              </div>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-2">{cat.title}</h3>
                <p className="text-slate-500 line-clamp-2">{cat.desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
