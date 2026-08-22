const fs = require('fs');
let content = fs.readFileSync('src/app/(auth)/login/page.tsx', 'utf8');

if (!content.includes('react-hot-toast')) {
  content = content.replace('import { useState, Suspense } from "react";', 'import { useState, Suspense } from "react";\nimport { toast } from "react-hot-toast";');
  content = content.replace('router.push(redirectUrl);', 'toast.success("Successfully authenticated!");\n      router.push(redirectUrl);');
}

fs.writeFileSync('src/app/(auth)/login/page.tsx', content, 'utf8');
