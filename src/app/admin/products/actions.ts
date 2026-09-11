"use server";

import { createClient } from "@/lib/supabase/server";

export async function getProductsForDdpEstimate(productIds: string[]) {
  const supabase = await createClient();
  
  // 1. Verify admin authorization
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== "ezeilodavid292@gmail.com") {
    throw new Error("Unauthorized");
  }

  // Use service role to ensure we bypass any RLS for admin operations
  const { createClient: createAdminClient } = require('@supabase/supabase-js');
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  if (!productIds || productIds.length === 0) return [];

  // Fetch all requested products
  const { data: products, error } = await supabaseAdmin
    .from("products")
    .select("id, name, sku, slug, category, variants, specifications, weight_kg, package_dimensions, package_weight_kg")
    .in("id", productIds);

  if (error || !products) {
    throw new Error("Failed to fetch products for DDP estimate");
  }

  // Format and structure the data to return
  return products.map(p => {
    // Determine Alibaba URL
    let alibabaUrl = "Not provided";
    if (p.variants && typeof p.variants === 'object' && p.variants.supplier_product_url) {
      alibabaUrl = p.variants.supplier_product_url;
    }

    // Determine Standard Size from specifications
    let standardSize = "Not provided";
    if (Array.isArray(p.specifications)) {
      const sizeSpec = p.specifications.find((s: any) => 
        s.key?.toLowerCase() === 'size' || 
        s.key?.toLowerCase() === 'dimensions' ||
        s.key?.toLowerCase() === 'standard size'
      );
      if (sizeSpec) standardSize = sizeSpec.value;
    }

    // Attempt to gather some variant info if sizes/colors exist
    let variantInfo = "Standard";
    if (p.variants && typeof p.variants === 'object') {
      const colors = Array.isArray(p.variants.colors) && p.variants.colors.length > 0 ? p.variants.colors.join(", ") : "";
      if (colors) {
        variantInfo = `Colors available: ${colors}`;
      }
    }

    return {
      id: p.id,
      name: p.name || "Not provided",
      sku: p.sku || "Not provided",
      iconjUrl: `https://iconj.com.ng/shop/${p.id}`,
      alibabaUrl: alibabaUrl,
      standardSize: standardSize,
      quantity: "1 set", // Default as requested
      productWeight: p.weight_kg ? `${p.weight_kg} kg` : "Not provided",
      packageDimensions: p.package_dimensions || "Not provided",
      packageWeight: p.package_weight_kg ? `${p.package_weight_kg} kg` : "Not provided",
      variantInfo: variantInfo
    };
  });
}
