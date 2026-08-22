const fs = require('fs');
let content = fs.readFileSync('src/app/shop/page.tsx', 'utf8');

// replace function signature
content = content.replace(
  'export default async function ShopPage() {',
  'export default async function ShopPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) {\\n  const params = await searchParams;\\n  const q = params.q;'
);

// replace query
content = content.replace(
  '  const { data: products } = await supabase.from("products").select("*").order("created_at", { ascending: false });',
  \  let query = supabase.from("products").select("*").order("created_at", { ascending: false });
  if (q) {
    query = query.or(\\\
ame.ilike.%\%,category.ilike.%\%\\\);
  }
  const { data: products } = await query;\
);

// add visual indicator if searching
content = content.replace(
  '<span className="text-slate-900">All Products</span>',
  '<span className="text-slate-900">{q ? Search Results for "\" : "All Products"}</span>'
);

fs.writeFileSync('src/app/shop/page.tsx', content, 'utf8');
