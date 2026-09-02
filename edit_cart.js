const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'src/app/cart/page.tsx');
let content = fs.readFileSync(file, 'utf8');

const replacement = `
                  <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800 font-bold mb-1">PLEASE CHECK YOUR MEASUREMENTS</p>
                    <p className="text-xs text-amber-700">Customized orders are fulfilled according to the specifications submitted here. Please ensure your measurements and selected options are accurate before proceeding.</p>
                  </div>
                  
                  <div className="space-y-3 text-sm text-slate-600 pb-4 border-b">
`;

content = content.replace('<div className="space-y-3 text-sm text-slate-600 pb-4 border-b">', replacement);

fs.writeFileSync(file, content);
console.log('Added measurement warning to cart');
