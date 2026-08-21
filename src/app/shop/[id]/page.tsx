import { ChevronRight, Check, Star, Truck, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProductDetailsClient } from "./ProductDetailsClient";

export const revalidate = 0;

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  
  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Product Not Found</h1>
          <Link href="/shop" className="text-blue-600 hover:underline">Return to Shop</Link>
        </div>
      </div>
    );
  }

  // Fallback image handling
  const getProductImage = (category: string) => {
    if (category?.includes("Motorized")) return "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&q=80";
    if (category?.includes("Blackout")) return "https://images.unsplash.com/photo-1615873968403-89e068629265?w=600&q=80";
    if (category?.includes("Track") || category?.includes("Curtain")) return "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80";
    return "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&q=80";
  };
  
  const images = product.images && product.images.length > 0 ? product.images : [getProductImage(product.category)];

  return (
    <div className="bg-slate-50 min-h-screen pb-12">
      <div className="bg-white border-b shadow-sm mb-4 lg:mb-8">
        <div className="container mx-auto px-4 py-3 flex items-center text-xs font-medium text-slate-500 overflow-x-auto whitespace-nowrap">
          <Link href="/" className="hover:text-blue-600">Home</Link>
          <ChevronRight className="w-3 h-3 mx-2 shrink-0" />
          <Link href="/shop" className="hover:text-blue-600">Products</Link>
          <ChevronRight className="w-3 h-3 mx-2 shrink-0" />
          <span className="text-slate-900 truncate max-w-[200px]">{product.name}</span>
        </div>
      </div>

      <div className="container mx-auto px-4">
        {/* Pass data to Client Component for interactivity */}
        <ProductDetailsClient product={product} images={images} />
        
        {/* Rich Content Below The Fold */}
        <div className="mt-8 grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4 pb-4 border-b">Product Description</h2>
              <div className="text-slate-700 leading-relaxed whitespace-pre-wrap text-sm md:text-base">
                {product.description || "No description provided."}
              </div>
            </div>

            {(product.features?.length > 0 || product.specifications?.length > 0) && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4 pb-4 border-b">Product Details</h2>
                
                {product.features?.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-slate-900 mb-3">Key Features</h3>
                    <ul className="grid sm:grid-cols-2 gap-3">
                      {product.features.map((feature: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                          <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {product.specifications?.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-3">Specifications</h3>
                    <div className="border rounded-md overflow-hidden">
                      {product.specifications.map((spec: any, idx: number) => (
                        <div key={idx} className={`flex text-sm ${idx % 2 === 0 ? "bg-slate-50" : "bg-white"} border-b last:border-0`}>
                          <div className="w-1/3 py-2 px-4 font-medium text-slate-700 border-r">{spec.key}</div>
                          <div className="w-2/3 py-2 px-4 text-slate-600">{spec.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Trust Sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm border p-5">
              <h3 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wider">Delivery & Returns</h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded bg-blue-50 flex items-center justify-center shrink-0"><Truck className="w-5 h-5 text-blue-600" /></div>
                  <div>
                    <h4 className="font-semibold text-sm text-slate-900">Nationwide Delivery</h4>
                    <p className="text-xs text-slate-500 mt-1">Ships direct to anywhere in Nigeria. Delivery time typically 7-14 working days.</p>
                  </div>
                </div>
                <div className="flex gap-3 pt-4 border-t">
                  <div className="w-10 h-10 rounded bg-emerald-50 flex items-center justify-center shrink-0"><ShieldCheck className="w-5 h-5 text-emerald-600" /></div>
                  <div>
                    <h4 className="font-semibold text-sm text-slate-900">Buyer Protection</h4>
                    <p className="text-xs text-slate-500 mt-1">Guaranteed factory quality. Protected payments via Paystack.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
