const fs = require('fs');
let content = fs.readFileSync('src/app/account/orders/page.tsx', 'utf8');
content = content.replace(
  '<Link href="/account/orders" className="flex items-center gap-3 px-4 py-3 bg-slate-100 border-l-4 border-orange-500 font-bold text-slate-900 border-t">\n                  <Package className="w-5 h-5 text-orange-500" /> My Orders\n                </Link>\n                <Link href="/account/issues"',
  '<Link href="/account/orders" className="flex items-center gap-3 px-4 py-3 bg-slate-100 border-l-4 border-orange-500 font-bold text-slate-900 border-t">\n                  <Package className="w-5 h-5 text-orange-500" /> My Orders\n                </Link>\n                <Link href="/account/addresses" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 border-l-4 border-transparent text-slate-700 font-medium border-t">\n                  <MapPin className="w-5 h-5 text-slate-400" /> Saved Addresses\n                </Link>\n                <Link href="/account/issues"'
);
fs.writeFileSync('src/app/account/orders/page.tsx', content, 'utf8');
