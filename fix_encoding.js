const fs = require('fs');
let content = fs.readFileSync('src/app/admin/ddp/DDPDashboardClient.tsx', 'utf8');
content = content.replace(/â‚¦/g, '?');
content = content.replace(/₦/g, '?');
fs.writeFileSync('src/app/admin/ddp/DDPDashboardClient.tsx', content, 'utf8');
