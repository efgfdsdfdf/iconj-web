import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DeleteProductButton } from "./DeleteProductButton";
import { Edit, Download } from "lucide-react";
import { LiveSearch } from "@/components/admin/LiveSearch";
import { AdminProductListClient } from "./AdminProductListClient";

export const revalidate = 0;

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<{ search?: string }> }) {
  const supabase = await createClient();
  const params = await searchParams;
  const search = params.search || "";

  let query = supabase
    .from("products")
    .select("*")
    .not("name", "ilike", "[DELETED]%")
    .order("created_at", { ascending: false });

  if (search) {
    const safeSearch = JSON.stringify(`%${search}%`);
    query = query.or(`name.ilike.${safeSearch},sku.ilike.${safeSearch}`);
  }

  const { data: products } = await query;

  return (
    <main className="flex-1 p-4 md:p-8 min-h-[calc(100vh-130px)] overflow-x-hidden">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Products</h1>
          <p className="text-sm text-slate-500">Manage your catalog directly from the database.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 self-start md:self-auto w-full md:w-auto">
          <LiveSearch placeholder="Search name or SKU..." />

          <Link href="/admin/products/import">
            <Button variant="outline" className="border-orange-300 text-orange-600 hover:bg-orange-50 font-bold h-10">
              <Download className="w-4 h-4 mr-2" /> Import from Alibaba
            </Button>
          </Link>
          <Link href="/admin/products/new">
            <Button className="bg-blue-600 hover:bg-blue-700 h-10">Add New Product</Button>
          </Link>
        </div>
      </div>
      <Card>
        <CardContent className="p-0">
          <AdminProductListClient products={products || []} search={search} />
        </CardContent>
      </Card>
    </main>
  );
}
