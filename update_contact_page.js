const fs = require('fs');
let content = fs.readFileSync('src/app/contact/page.tsx', 'utf8');

if (!content.includes('import { ContactForm }')) {
  content = content.replace('import { Mail, MapPin, Phone } from "lucide-react";', 'import { Mail, MapPin, Phone } from "lucide-react";\nimport { ContactForm } from "./ContactForm";');
}

// Replace the entire form block
content = content.replace(
  /<form className="space-y-6">[\s\S]*?<\/form>/m,
  '<ContactForm />'
);

fs.writeFileSync('src/app/contact/page.tsx', content, 'utf8');
