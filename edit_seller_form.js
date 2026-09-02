const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'src/app/seller/products/new/page.tsx');
let content = fs.readFileSync(file, 'utf8');

// Add compare_at_price to state
content = content.replace(
  /selling_price: "",/,
  `selling_price: "",\n    compare_at_price: "",`
);

// Add compare_at_price to payload
content = content.replace(
  /selling_price: formData.selling_price,/,
  `selling_price: formData.selling_price,\n          compare_at_price: formData.compare_at_price,`
);

// Add the UI field
const ui = `
                <div className="space-y-2">
                  <Label>Compare at Price (?)</Label>
                  <Input type="number" value={formData.compare_at_price} onChange={e => setFormData({...formData, compare_at_price: e.target.value})} placeholder="e.g. 25000" />
                  <p className="text-xs text-slate-500">Original price (shows as strikethrough: <s>?25,000</s>)</p>
                </div>
`;

content = content.replace(
  /\{isWholesale && <p className="text-xs text-slate-500">Base price per unit \(before bulk discounts\)<\/p>\}\n                <\/div>/,
  `{isWholesale && <p className="text-xs text-slate-500">Base price per unit (before bulk discounts)</p>}\n                </div>\n${ui}`
);

fs.writeFileSync(file, content);
console.log('Done modifying seller product form');
