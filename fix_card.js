const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'src/components/product/ProductCard.tsx');
let content = fs.readFileSync(file, 'utf8');

// Replace onClick to navigate to product page instead of adding to cart
content = content.replace(
  /onClick=\{handleAddToCart\}/g,
  `onClick={(e) => { e.preventDefault(); router.push(\`/shop/\${product.id}\`); }}`
);

fs.writeFileSync(file, content);
console.log('Done fixing ProductCard');
