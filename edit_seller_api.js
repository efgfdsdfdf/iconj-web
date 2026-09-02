const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'src/app/api/seller/products/route.ts');
let content = fs.readFileSync(file, 'utf8');

// Extract compare_at_price from request
content = content.replace(
  /const \{ name, sku, selling_price, description, stock_status, category_id, category, images, business_type, moq, brand, features, weight_kg, pricing_tiers, stock_quantity \} = await req.json\(\);/,
  `const { name, sku, selling_price, compare_at_price, description, stock_status, category_id, category, images, business_type, moq, brand, features, weight_kg, pricing_tiers, stock_quantity } = await req.json();`
);

// Add variants to insert payload
content = content.replace(
  /base_selling_price: parseFloat\(selling_price\),\n      base_supplier_cost: 0,/,
  `base_selling_price: parseFloat(selling_price),\n      base_supplier_cost: 0,\n      variants: compare_at_price ? { compare_at_price: parseFloat(compare_at_price) } : {},`
);

fs.writeFileSync(file, content);
console.log('Done modifying seller product API');
