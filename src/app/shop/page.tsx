import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, Filter, SlidersHorizontal, ChevronDown, Star } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/product/ProductCard";

export const revalidate = 0;

export default async function ShopPage() {
  const supabase = await createClient();
  const { data: products } = await supabase.from("products").select("*").order("created_at", { ascending: false });

  const getProductImage = (category: string) => {
    if (category?.includes("Motorized")) return "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&q=80";
    if (category?.includes("Blackout")) return "https://images.unsplash.com/photo-1615873968403-89e068629265?w=600&q=80";
    if (category?.includes("Track") || category?.includes("Curtain")) return "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80";
    return "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&q=80";
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-12">
      {/* Breadcrumb Header */}
      <div className="bg-white border-b shadow-sm mb-4 lg:mb-8">
        <div className="container mx-auto px-4 py-3 flex items-center text-xs font-medium text-slate-500">
          <Link href="/" className="hover:text-blue-600">Home</Link>
          <ChevronRight className="w-3 h-3 mx-2" />
          <span className="text-slate-900">All Products</span>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Desktop Sidebar Filters */}
          <div className="hidden lg:block w-64 shrink-0">
            <Card className="border-none shadow-sm sticky top-24">
              <CardContent className="p-4 space-y-6">
                <div>
                  <h3 className="font-bold text-slate-900 mb-3 pb-2 border-b">Category</h3>
                  <div className="space-y-2 text-sm text-slate-600">
                    <label className="flex items-center gap-2 cursor-pointer hover:text-rose-500"><input type="checkbox" className="rounded" /> Newborn Essentials</label>
                    <label className="flex items-center gap-2 cursor-pointer hover:text-rose-500"><input type="checkbox" className="rounded" /> Baby Feeding</label>
                    <label className="flex items-center gap-2 cursor-pointer hover:text-rose-500"><input type="checkbox" className="rounded" /> Baby Care & Bath</label>
                    <label className="flex items-center gap-2 cursor-pointer hover:text-rose-500"><input type="checkbox" className="rounded" /> Baby Safety</label>
                    <label className="flex items-center gap-2 cursor-pointer hover:text-rose-500"><input type="checkbox" className="rounded" /> Maternity</label>
                    <label className="flex items-center gap-2 cursor-pointer hover:text-rose-500"><input type="checkbox" className="rounded" /> Gifts & Bundles</label>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 mb-3 pb-2 border-b">Price (?)</h3>
                  <div className="flex items-center gap-2">
                    <input type="number" placeholder="Min" className="w-full h-8 text-sm border rounded px-2" />
                    <span className="text-slate-400">-</span>
                    <input type="number" placeholder="Max" className="w-full h-8 text-sm border rounded px-2" />
                  </div>
                  <Button size="sm" className="w-full mt-3 bg-orange-500 hover:bg-orange-600">Apply</Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Product Grid */}
          <div className="flex-1">
            <Card className="border-none shadow-sm bg-white mb-4">
              <div className="p-4 flex items-center justify-between border-b">
                <h1 className="text-lg md:text-xl font-bold text-slate-900">Products ({products?.length || 0} items)</h1>
                
                {/* Mobile Filter Buttons */}
                <div className="flex lg:hidden gap-2">
                  <Button variant="outline" size="sm" className="text-xs h-8"><SlidersHorizontal className="w-3 h-3 mr-1"/> Sort</Button>
                  <Button variant="outline" size="sm" className="text-xs h-8"><Filter className="w-3 h-3 mr-1"/> Filter</Button>
                </div>

                {/* Desktop Sort */}
                <div className="hidden lg:flex items-center gap-2 text-sm">
                  <span className="text-slate-500">Sort by:</span>
                  <Button variant="outline" size="sm" className="h-8">Popularity <ChevronDown className="w-3 h-3 ml-2"/></Button>
                </div>
              </div>

              <CardContent className="p-2 sm:p-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
                  {products?.map((product: any) => {
                    const p = { ...product, images: product.images || [getProductImage(product.category)] };
                    return <ProductCard key={product.id} product={p} />;
                  })}
                  
                  {(!products || products.length === 0) && (
                    <div className="col-span-full py-12 text-center text-slate-500">
                      No products found. Add some from the Admin Dashboard!
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
        </div>
      </div>
    </div>
  );
}
