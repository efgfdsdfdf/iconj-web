const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'src/components/product/ProductCard.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "{isOutOfStock ? 'Out of Stock' : added ? 'Added!' : 'Add to Cart'}",
  "{isOutOfStock ? 'Out of Stock' : added ? 'Added!' : 'Customize'}"
);

fs.writeFileSync(file, content);
console.log('Done modifying ProductCard.tsx');
