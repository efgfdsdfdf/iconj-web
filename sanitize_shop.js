const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'src/app/shop/page.tsx');
let content = fs.readFileSync(file, 'utf8');

const target = `                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-1 sm:gap-6">
                    {products?.map((product: any) => {`;

const replacement = `                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-1 sm:gap-6">
                    {products?.map((product: any) => {
                      // SECURITY: Strip sensitive fields before passing to client components
                      const p = { ...product, images: product.images || [getProductImage(product.category)] };
                      delete p.base_supplier_cost;
                      delete p.supplier_id;
                      if (p.variants) {
                        delete p.variants.supplier_product_url;
                        delete p.variants.supplier_sku;
                      }`;

content = content.replace(target, replacement);

fs.writeFileSync(file, content);
console.log('Sanitized shop listing');
