/**
 * ICONJ DDP Shipping — Existing Product Migration Script
 * 
 * Run: node -r dotenv/config scripts/migrate-product-shipping-status.js
 * 
 * SAFE: This script only ADDS/UPDATES shipping_data_status on existing products.
 * It does NOT change product IDs, prices, images, variants, URLs, or any other data.
 * It does NOT invent shipping data — only marks what is missing.
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  console.log('\n🚀 ICONJ DDP Shipping — Product Migration\n');
  console.log('⚠️  SAFE MODE: Only updating shipping_data_status. No product data changed.\n');

  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, sku, is_configurable, shipping_weight_kg, shipping_length_cm, shipping_width_cm, shipping_height_cm')
    .eq('is_active', true);

  if (error) {
    console.error('❌ Failed to fetch products:', error.message);
    process.exit(1);
  }

  console.log(`📦 Found ${products.length} active products to migrate.\n`);

  let countMissing = 0;
  let countPartial = 0;
  let countComplete = 0;
  let countCustomRequired = 0;
  let errors = 0;

  for (const product of products) {
    let newStatus;

    if (product.is_configurable) {
      newStatus = 'CUSTOM_REQUIRED';
      countCustomRequired++;
    } else if (!product.shipping_weight_kg) {
      newStatus = 'MISSING';
      countMissing++;
    } else if (!product.shipping_length_cm || !product.shipping_width_cm || !product.shipping_height_cm) {
      newStatus = 'PARTIAL';
      countPartial++;
    } else {
      newStatus = 'COMPLETE';
      countComplete++;
    }

    const { error: updateError } = await supabase
      .from('products')
      .update({ shipping_data_status: newStatus })
      .eq('id', product.id);

    if (updateError) {
      console.error(`  ❌ Failed to update ${product.name} (${product.id}):`, updateError.message);
      errors++;
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 DDP MIGRATION REPORT');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ COMPLETE     (weight + dims, ready for DDP): ${countComplete}`);
  console.log(`⚠️  PARTIAL      (weight only, no dimensions): ${countPartial}`);
  console.log(`❌ MISSING      (no shipping data at all):     ${countMissing}`);
  console.log(`🔧 CUSTOM REQ.  (custom-size, needs quote):    ${countCustomRequired}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`   Total processed: ${products.length}`);
  console.log(`   Errors: ${errors}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (countMissing > 0 || countPartial > 0) {
    console.log('👉 NEXT STEPS:');
    console.log(`   Go to Admin → Shipping → Products Missing Shipping Data`);
    console.log(`   to add weight and dimensions to the ${countMissing + countPartial} products that need it.\n`);
  }

  if (countComplete > 0) {
    console.log(`✨ ${countComplete} products are ready to use the DDP engine as soon as:`);
    console.log('   1. DDP rates are configured in Admin → Shipping → Manage Rates');
    console.log('   2. The supplier volumetric divisor is confirmed in Admin → Shipping → Settings\n');
  }

  console.log('✅ Migration complete. No product data was changed.\n');
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
