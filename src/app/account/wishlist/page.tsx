import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Heart, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { revalidatePath } from "next/cache";

export const metadata = { title: "My Wishlist | ICONJ" };

async function removeWishlistItem(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const productId = formData.get("product_id") as string;
  if (productId) {
    await supabase.from("wishlists").delete().eq("user_id", user.id).eq("product_id", productId);
    revalidatePath("/account/wishlist");
  }
}

export default async function WishlistPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/account/wishlist");
  }

  // Fetch wishlist joined with products
  const { data: wishlistItems } = await supabase
    .from("wishlists")
    .select(`
      product_id,
      created_at,
      products (
        id,
        name,
        base_selling_price,
        images
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8 flex items-center gap-4">
        <Link href="/account" className="text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Heart className="w-8 h-8 text-rose-500" /> My Wishlist
        </h1>
      </div>

      {!wishlistItems || wishlistItems.length === 0 ? (
        <div className="text-center py-24 bg-slate-50 rounded-lg border border-dashed">
          <Heart className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Your wishlist is empty</h2>
          <p className="text-slate-500 mb-6">Save items you love and buy them later.</p>
          <Link href="/shop">
            <Button className="bg-rose-500 hover:bg-rose-600">Explore Products</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {wishlistItems.map((item: any) => {
            const product = item.products;
            if (!product) return null;
            
            const image = product.images?.[0] || 'https://via.placeholder.com/400?text=No+Image';

            return (
              <div key={item.product_id} className="bg-white rounded-xl shadow-sm border overflow-hidden group">
                <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
                  <img src={image} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <form action={removeWishlistItem}>
                      <input type="hidden" name="product_id" value={product.id} />
                      <button type="submit" className="bg-white/90 p-2 rounded-full shadow hover:bg-red-50 hover:text-red-600 transition-colors" title="Remove from wishlist">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                </div>
                <div className="p-4">
                  <Link href={`/shop/${product.id}`} className="block">
                    <h3 className="font-semibold text-slate-900 line-clamp-1 hover:text-blue-600 transition-colors">{product.name}</h3>
                  </Link>
                  <p className="text-emerald-600 font-bold mt-2">₦{Number(product.base_selling_price).toLocaleString()}</p>
                  
                  <Link href={`/shop/${product.id}`} className="block mt-4">
                    <Button variant="outline" className="w-full border-blue-200 text-blue-700 hover:bg-blue-50">
                      <ShoppingBag className="w-4 h-4 mr-2" /> View Details
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
