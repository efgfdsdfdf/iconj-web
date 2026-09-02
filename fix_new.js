const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'src/app/seller/products/new/page.tsx');
let content = fs.readFileSync(file, 'utf8');

const target = `<Input type="number" required value={formData.selling_price} onChange={e => setFormData({...formData, selling_price: e.target.value})} placeholder="0.00" />
                  {isWholesale && <p className="text-xs text-slate-500">Base price per unit (before bulk discounts)</p>}
                </div>`;

const replacement = `<Input type="number" required value={formData.selling_price} onChange={e => setFormData({...formData, selling_price: e.target.value})} placeholder="0.00" />
                  {isWholesale && <p className="text-xs text-slate-500">Base price per unit (before bulk discounts)</p>}
                </div>
                <div className="space-y-2">
                  <Label>Compare at Price (?)</Label>
                  <Input type="number" value={formData.compare_at_price} onChange={e => setFormData({...formData, compare_at_price: e.target.value})} placeholder="e.g. 25000" />
                  <p className="text-xs text-slate-500">Original price (shows as strikethrough: <s>?25,000</s>)</p>
                </div>`;

if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(file, content);
    console.log('Successfully injected UI in new/page.tsx');
} else {
    console.log('Target not found in new/page.tsx');
}
