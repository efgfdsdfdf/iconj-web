const fs = require('fs');
let content = fs.readFileSync('src/app/admin/support/page.tsx', 'utf8');

content = content.replace(
  '.select("*, profiles(name, email)")',
  '.select("*")'
);

fs.writeFileSync('src/app/admin/support/page.tsx', content, 'utf8');
