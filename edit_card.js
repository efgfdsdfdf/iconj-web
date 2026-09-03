const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'src/components/product/ProductCard.tsx');
let content = fs.readFileSync(file, 'utf8');

// Add import
content = content.replace(
  /import \{ useState \} from "react";/,
  `import { useState } from "react";\nimport { useRouter } from "next/navigation";`
);

// Add router
content = content.replace(
  /const \[added, setAdded\] = useState\(false\);/,
  `const [added, setAdded] = useState(false);\n  const router = useRouter();`
);

// Replace button onClick and remove added state usage
content = content.replace(
  /onClick={handleAddToCart}\n            >\n              \{!isOutOfStock && \(added \? <Check className="w-3\.5 h-3\.5" \/> : <ShoppingCart className="w-3\.5 h-3\.5" \/>\)\}\n              \{isOutOfStock \? 'Out of Stock' : added \? 'Added!' : 'Customize'\}/,
  `onClick={(e) => { e.preventDefault(); router.push('/shop/' + product.id); }}\n            >\n              {!isOutOfStock && <ShoppingCart className="w-3.5 h-3.5" />}\n              {isOutOfStock ? 'Out of Stock' : 'Customize'}`
);

fs.writeFileSync(file, content);
console.log('Done modifying ProductCard');
