const fs = require('fs');
let content = fs.readFileSync('src/app/api/checkout/route.ts', 'utf8');

const replacement = \      // Create a server Supabase client using Service Role to bypass RLS
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    // Fetch actual supplier costs from the database securely
    const productIds = items.map((i: any) => i.id);
    const { data: dbProducts } = await supabaseAdmin
      .from("products")
      .select("id, base_supplier_cost")
      .in("id", productIds);
      
    let actualSupplierCost = 0;
    items.forEach((item: any) => {
      const dbProduct = dbProducts?.find((p: any) => p.id === item.id);
      const unitCost = dbProduct ? Number(dbProduct.base_supplier_cost) || 0 : 0;
      actualSupplierCost += (unitCost * item.quantity);
    });
    
    const estimatedProfit = subtotal - actualSupplierCost;\;

content = content.replace(
  \    // Rough estimate based on the 30% margin rule (Selling Price = Cost / 0.70)
    const supplierCost = subtotal * 0.70;
    const estimatedProfit = subtotal - supplierCost;

    // Create a server Supabase client using Service Role to bypass RLS
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);\,
  replacement
);

content = content.replace(
  \supplier_cost: supplierCost,\,
  \supplier_cost: actualSupplierCost,\
);

fs.writeFileSync('src/app/api/checkout/route.ts', content, 'utf8');
