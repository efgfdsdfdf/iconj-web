const fs = require('fs');
let pageContent = fs.readFileSync('src/app/page.tsx', 'utf8');
pageContent = pageContent.replace('grid-cols-1 sm:grid-cols-2 lg:grid-cols-4', 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4');
fs.writeFileSync('src/app/page.tsx', pageContent, 'utf8');

let shopContent = fs.readFileSync('src/app/shop/page.tsx', 'utf8');
shopContent = shopContent.replace('grid-cols-1 sm:grid-cols-2 lg:grid-cols-4', 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4');
fs.writeFileSync('src/app/shop/page.tsx', shopContent, 'utf8');
