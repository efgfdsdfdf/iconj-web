const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'src/app/shop/[id]/ProductDetailsClient.tsx');
let content = fs.readFileSync(file, 'utf8');

const target = `<div className="flex flex-col gap-2">
              <div className="flex items-end gap-3">`;

const replacement = `<div className="flex flex-col gap-2">
              {product.variants?.compare_at_price > 0 && product.variants?.compare_at_price > currentPrice && (
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg text-slate-400 line-through decoration-1">
                    ?{Number(product.variants.compare_at_price).toLocaleString()}
                  </span>
                  <span className="bg-rose-100 text-rose-700 text-xs font-bold px-2 py-0.5 rounded">
                    -{Math.round(((product.variants.compare_at_price - currentPrice) / product.variants.compare_at_price) * 100)}%
                  </span>
                </div>
              )}
              <div className="flex items-end gap-3">`;

content = content.replace(target, replacement);

fs.writeFileSync(file, content);
console.log('Done');
