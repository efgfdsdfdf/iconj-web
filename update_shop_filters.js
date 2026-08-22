const fs = require('fs');
let content = fs.readFileSync('src/app/shop/page.tsx', 'utf8');

// 1. Get the category param
content = content.replace(
  'const q = params.q;',
  \const q = params.q;
  const category = params.category;\
);

// 2. Apply category filter
content = content.replace(
  '  if (q) {',
  \  if (category) {
    query = query.eq('category', category);
  }
  if (q) {\
);

// 3. Fix the Breadcrumb to show category if selected
content = content.replace(
  '<span className="text-slate-900">{q ? \Search Results for "\"\ : "All Products"}</span>',
  '<span className="text-slate-900">{q ? \Search Results for "\"\ : category ? category : "All Products"}</span>'
);

// 4. Replace static checkboxes with Links
content = content.replace(
  /<div className="space-y-2 text-sm text-slate-600">[\s\S]*?<\/div>/,
  \<div className="space-y-3 text-sm text-slate-600 flex flex-col">
                    <Link href="/shop" className={\hover:text-rose-500 transition-colors \\}>All Categories</Link>
                    <Link href="/shop?category=Newborn+Essentials" className={\hover:text-rose-500 transition-colors \\}>Newborn Essentials</Link>
                    <Link href="/shop?category=Baby+Feeding" className={\hover:text-rose-500 transition-colors \\}>Baby Feeding</Link>
                    <Link href="/shop?category=Baby+Care+%26+Bath" className={\hover:text-rose-500 transition-colors \\}>Baby Care & Bath</Link>
                    <Link href="/shop?category=Baby+Safety" className={\hover:text-rose-500 transition-colors \\}>Baby Safety</Link>
                    <Link href="/shop?category=Maternity" className={\hover:text-rose-500 transition-colors \\}>Maternity</Link>
                    <Link href="/shop?category=Gifts+%26+Bundles" className={\hover:text-rose-500 transition-colors \\}>Gifts & Bundles</Link>
                  </div>\
);

fs.writeFileSync('src/app/shop/page.tsx', content, 'utf8');
