const fs = require('fs');
let content = fs.readFileSync('src/components/product/ProductCard.tsx', 'utf8');
if (!content.endsWith('}')) {
  content += '\n}';
}
fs.writeFileSync('src/components/product/ProductCard.tsx', content, 'utf8');
