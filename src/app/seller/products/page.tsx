import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { DeleteProductButton } from "@/components/seller/DeleteProductButton";

export default async function SellerProductsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: seller } = await supabase
    .from("sellers")
    .select("id")
    .eq("profile_id", user?.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("seller_id", seller?.id)
    .not("name", "ilike", "[DELETED]%")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Products</h1>
          <p className="text-sm text-slate-500">Manage your listings, inventory, and pricing.</p>
        </div>
        <Link href="/seller/products/new">
          <Button className="bg-orange-500 hover:bg-orange-600 gap-2">
            <Plus className="w-4 h-4" /> Add New Product
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                <tr>
                  <th className="px-6 py-4">Product Name</th>
                  <th className="px-6 py-4">SKU</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {products?.map((product: any) => (
                  <tr key={product.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded">
                        {product.images?.[0] && <img src={product.images[0]} className="w-full h-full object-cover rounded" />}
                      </div>
                      {product.name}
                    </td>
                    <td className="px-6 py-4">{product.sku}</td>
                    <td className="px-6 py-4">₦{Number(product.base_selling_price).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      {product.is_active ? (
                        <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-700 text-xs font-bold">Active</span>
                      ) : (
                        <span className="px-2 py-1 rounded bg-slate-100 text-slate-700 text-xs font-bold">Inactive</span>
                      )}
                    </td>
                    <td className="px-6 py-4 flex items-center">
                      <Link href={`/seller/products/${product.id}/edit`} className="text-blue-600 hover:underline text-xs font-bold">Edit</Link>
                      <DeleteProductButton productId={product.id} />
                    </td>
                  </tr>
                ))}
                {(!products || products.length === 0) && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">No products found. Add your first product.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
