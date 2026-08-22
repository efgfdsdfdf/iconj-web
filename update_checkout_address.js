const fs = require('fs');
let content = fs.readFileSync('src/app/checkout/page.tsx', 'utf8');

content = content.replace(
  /supabase\.from\("addresses"\)\.select\("\*"\)\.eq\("user_id", data\.user\.id\)\.order\("is_default", \{ ascending: false \}\)\.limit\(1\)\.then\(\(\{ data: addresses \}\) => \{/,
  \const rawAddresses = data.user.user_metadata?.addresses || [];
          const addresses = Array.isArray(rawAddresses) ? rawAddresses.sort((a, b) => (b.is_default ? 1 : 0) - (a.is_default ? 1 : 0)) : [];
          if (true) {\
);

fs.writeFileSync('src/app/checkout/page.tsx', content, 'utf8');
