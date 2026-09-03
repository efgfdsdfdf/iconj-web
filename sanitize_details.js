const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'src/app/shop/[id]/page.tsx');
let content = fs.readFileSync(file, 'utf8');

const target = `  let product = productRaw;
  if (product) {`;

const replacement = `  let product = productRaw;
  if (product) {
    // SECURITY: Sanitize sensitive supplier and cost data before passing to client components
    delete product.base_supplier_cost;
    delete product.supplier_id;
    if (product.variants) {
      delete product.variants.supplier_product_url;
      delete product.variants.supplier_sku;
    }`;

content = content.replace(target, replacement);

fs.writeFileSync(file, content);
console.log('Sanitized shop product details');
