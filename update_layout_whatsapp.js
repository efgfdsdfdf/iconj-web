const fs = require('fs');
let content = fs.readFileSync('src/app/layout.tsx', 'utf8');

if (!content.includes('WhatsAppWidget')) {
  content = content.replace(
    'import { Toaster } from "react-hot-toast";',
    'import { Toaster } from "react-hot-toast";\nimport { WhatsAppWidget } from "@/components/WhatsAppWidget";'
  );
  
  content = content.replace(
    '<Toaster position="top-center" />',
    '<Toaster position="top-center" />\n        <WhatsAppWidget />'
  );
  
  fs.writeFileSync('src/app/layout.tsx', content, 'utf8');
}
