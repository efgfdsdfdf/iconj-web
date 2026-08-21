import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export default function CategoriesPage() {
  const categories = [
    { title: "Newborn Essentials", desc: "Curated bundles and must-haves for your baby's first months.", img: "https://images.unsplash.com/photo-1555252834-406eb1be18f4?w=800&q=80" },
    { title: "Baby Feeding", desc: "Bottles, high chairs, and accessories for mealtime.", img: "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=800&q=80" },
    { title: "Baby Bath & Care", desc: "Gentle hygiene and grooming products.", img: "https://images.unsplash.com/photo-1544640808-32cb4fbaee4d?w=800&q=80" },
    { title: "Toys & Development", desc: "Safe, engaging toys to help your little one grow.", img: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&q=80" },
    { title: "Maternity", desc: "Comfort and care products for expecting and new mothers.", img: "https://images.unsplash.com/photo-1517590858763-7e61a6b412ee?w=800&q=80" },
    { title: "Gifts & Bundles", desc: "Perfectly packaged essentials for baby showers.", img: "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=800&q=80" },
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mb-12">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Shop by Category</h1>
        <p className="text-lg text-slate-600">Browse our carefully curated range of premium mother and baby essentials, designed for the modern Nigerian family.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {categories.map((cat, i) => (
          <Link href={`/shop?category=${cat.title}`} key={i} className="group block">
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
