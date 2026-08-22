const fs = require('fs');
let content = fs.readFileSync('src/app/layout.tsx', 'utf8');

content = content.replace('import { WhatsAppWidget } from "@/components/WhatsAppWidget";', '');
content = content.replace('<WhatsAppWidget />', '');

fs.writeFileSync('src/app/layout.tsx', content, 'utf8');
