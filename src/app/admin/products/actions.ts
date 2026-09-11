"use server";

import { createClient } from "@/lib/supabase/server";

export async function getProductsForDdpEstimate(productIds: string[]) {
  const supabase = await createClient();
  
  // 1. Verify admin authorization
  const { requireAdmin } = await import("@/lib/auth/admin");
  await requireAdmin();

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
    .select("id, name, sku, category, variants, specifications, weight_kg, shipping_weight_kg, shipping_length_cm, shipping_width_cm, shipping_height_cm")
    .in("id", productIds);

  if (error || !products) {
    console.error("DDP Estimate DB Error:", error);
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

    // Format package dimensions
    let packageDimensions = "Not provided";
    if (p.shipping_length_cm && p.shipping_width_cm && p.shipping_height_cm) {
      packageDimensions = `${p.shipping_length_cm} × ${p.shipping_width_cm} × ${p.shipping_height_cm} cm`;
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
      packageDimensions: packageDimensions,
      packageWeight: p.shipping_weight_kg ? `${p.shipping_weight_kg} kg` : "Not provided",
      variantInfo: variantInfo
    };
  });
}
