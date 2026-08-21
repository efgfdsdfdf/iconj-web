const fs = require('fs');
let content = fs.readFileSync('src/app/shop/page.tsx', 'utf8');
content = content.replace('grid-cols-1 sm:grid-cols-2 lg:grid-cols-3', 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-3');
fs.writeFileSync('src/app/shop/page.tsx', content, 'utf8');
