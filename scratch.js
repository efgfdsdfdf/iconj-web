const fs = require('fs');
let p1 = "src/app/admin/marketing/coupons/edit/[id]/page.tsx";
let p2 = "src/app/admin/marketing/landing-pages/edit/[id]/page.tsx";
let c1 = fs.readFileSync(p1, 'utf8');
let c2 = fs.readFileSync(p2, 'utf8');

c1 = c1.replace('params: { id: string }', 'params: Promise<{ id: string }>');
c1 = c1.replace('const resolvedParams = params;', 'const resolvedParams = await params;');
fs.writeFileSync(p1, c1);

c2 = c2.replace('params: { id: string }', 'params: Promise<{ id: string }>');
c2 = c2.replace('const resolvedParams = params;', 'const resolvedParams = await params;');
fs.writeFileSync(p2, c2);
