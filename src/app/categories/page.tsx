import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export default function CategoriesPage() {
  const categories = [
    { title: "Smart Motorized Blinds", desc: "Automated shading for modern homes and offices.", img: "https://images.unsplash.com/photo-1513694203232-719a280e022f?ixlib=rb-4.0.3&w=800&q=80" },
    { title: "Blackout Blinds", desc: "Reduce sunlight and maximize your privacy.", img: "https://images.unsplash.com/photo-1615873968403-89e068629265?ixlib=rb-4.0.3&w=800&q=80" },
    { title: "Honeycomb Blinds", desc: "Insulating cellular shades for energy efficiency.", img: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?ixlib=rb-4.0.3&w=800&q=80" },
    { title: "Curtains & Roman Shades", desc: "Decorative interior design solutions.", img: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?ixlib=rb-4.0.3&w=800&q=80" },
    { title: "Smart Curtain Systems", desc: "Motorized tracks and automated rails for large windows.", img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&w=800&q=80" },
    { title: "Outdoor Shades", desc: "Weather protection for patios, balconies, and pergolas.", img: "https://images.unsplash.com/photo-1600607688969-a5bfcd64bd40?ixlib=rb-4.0.3&w=800&q=80" },
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mb-12">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Product Categories</h1>
        <p className="text-lg text-slate-600">Browse our wide range of premium window coverings, from smart motorized blinds to decorative curtains, designed for the modern Nigerian home.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {categories.map((cat, i) => (
          <Link href={`/shop?category=${cat.title.toLowerCase().replace(/ /g, "-")}`} key={i} className="group block">
            <Card className="overflow-hidden border-slate-200 transition-all hover:shadow-xl hover:-translate-y-1">
              <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
                <img src={cat.img} alt={cat.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                  <span className="text-white font-medium flex items-center gap-2">Explore Category &rarr;</span>
                </div>
              </div>
              <CardContent className="p-6">
                <h3 className="font-bold text-xl mb-2 text-slate-900 group-hover:text-blue-600 transition-colors">{cat.title}</h3>
                <p className="text-slate-500 leading-relaxed">{cat.desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
