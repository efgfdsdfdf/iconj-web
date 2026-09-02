const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'src/app/checkout/verify/actions.ts');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /if \(config\.requiresInstall\) specs \+\= `Installation: Yes \| `;/g,
  ''
);

fs.writeFileSync(file, content);
console.log('Done modifying verify actions');
