const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'src/components/layout/Footer.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /<Link href="\/terms-and-conditions" className="hover:text-amber-500 transition-colors">Terms & Conditions<\/Link><\/li>/,
  '<Link href="/terms-and-conditions" className="hover:text-amber-500 transition-colors">Terms & Conditions</Link></li>\n              <li><Link href="/customization-policy" className="hover:text-amber-500 transition-colors">Customization & Order Policy</Link></li>'
);

fs.writeFileSync(file, content);
console.log('Added policy to footer');
