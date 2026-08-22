const fs = require('fs');
let content = fs.readFileSync('src/app/account/page.tsx', 'utf8');

if (!content.includes('MessageCircle')) {
  content = content.replace(
    'AlertCircle,',
    'AlertCircle, MessageCircle,'
  );
  fs.writeFileSync('src/app/account/page.tsx', content, 'utf8');
}
