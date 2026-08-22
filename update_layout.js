const fs = require('fs');
let content = fs.readFileSync('src/app/layout.tsx', 'utf8');

if (!content.includes('react-hot-toast')) {
  content = content.replace('import { Navbar } from "@/components/layout/Navbar";', 'import { Navbar } from "@/components/layout/Navbar";\nimport { Toaster } from "react-hot-toast";');
  content = content.replace('{children}', '{children}\n        <Toaster position="top-center" />');
}

fs.writeFileSync('src/app/layout.tsx', content, 'utf8');
