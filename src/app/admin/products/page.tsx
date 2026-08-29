import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DeleteProductButton } from "./DeleteProductButton";
import { Edit, Download } from "lucide-react";

export const revalidate = 0;

export default async function AdminProductsPage() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .not("name", "ilike", "[DELETED]%")
    .order("created_at", { ascending: false });

  return (
    <main className="flex-1 p-4 md:p-8 min-h-[calc(100vh-130px)] overflow-x-hidden">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Products</h1>
          <p className="text-sm text-slate-500">Manage your catalog directly from the database.</p>
        </div>
        <div className="flex gap-3 self-start md:self-auto">
          <Link href="/admin/products/import">
            <Button variant="outline" className="border-orange-300 text-orange-600 hover:bg-orange-50 font-bold">
              <Download className="w-4 h-4 mr-2" /> Import from Alibaba
            </Button>
          </Link>
          <Link href="/admin/products/new">
            <Button className="bg-blue-600 hover:bg-blue-700">Add New Product</Button>
          </Link>
        </div>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Supplier Cost</TableHead>
                <TableHead>Selling Price</TableHead>
                <TableHead>Margin</TableHead>
                <TableHead className="text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products?.map((product: any) => (
                <TableRow key={product.id}>
                  <TableCell className="pl-6 font-medium">{product.name}</TableCell>
                  <TableCell className="text-xs text-slate-500">{product.sku}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>₦{Number(product.base_supplier_cost).toLocaleString()}</TableCell>
                  <TableCell className="font-bold text-slate-900">₦{Number(product.base_selling_price).toLocaleString()}</TableCell>
                  <TableCell className="text-emerald-600 font-medium bg-emerald-50/50">
                    {Math.round(((product.base_selling_price - product.base_supplier_cost) / product.base_selling_price) * 100)}%
                  </TableCell>
                  <TableCell className="text-right pr-6 flex justify-end items-center gap-2">
                    <Link href={`/admin/products/${product.id}/edit`} className="text-blue-500 hover:text-blue-700 p-2 rounded hover:bg-blue-50 transition-colors" title="Edit Product">
                      <Edit className="w-4 h-4" />
                    </Link>
                    <DeleteProductButton productId={product.id} />
                  </TableCell>
                </TableRow>
              ))}
              {(!products || products.length === 0) && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                    No products found in database.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
