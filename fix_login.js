const fs = require('fs');
let content = fs.readFileSync('src/app/(auth)/login/page.tsx', 'utf8');

content = content.replace(
  '      router.push(redirectUrl);\\n      router.refresh();',
  '      window.location.href = redirectUrl;'
);

fs.writeFileSync('src/app/(auth)/login/page.tsx', content, 'utf8');
