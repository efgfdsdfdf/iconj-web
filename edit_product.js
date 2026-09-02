const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'src/app/shop/[id]/ProductDetailsClient.tsx');
let content = fs.readFileSync(file, 'utf8');

// Replace Add to Cart
content = content.replace(
  '{product.stock_status === "Out of Stock" ? "Out of Stock" : adding ? "Adding to Cart..." : "Add to Cart"}',
  '{product.stock_status === "Out of Stock" ? "Out of Stock" : adding ? "Adding..." : "Customize & Order"}'
);

// Insert messaging right before the Actions section (where the Add to Cart button is)
// Let's find " {/* Actions */}" and insert the message.
const actionsHeader = '{/* Actions */}';
const customMessage = `
        <div className="mb-6 p-4 bg-slate-50 border border-slate-100 rounded-lg">
          <p className="font-semibold text-slate-900 mb-1">Customize this product to suit your space.</p>
          <p className="text-sm text-slate-600 mb-2">Select your preferred options and provide your measurements before placing your order.</p>
          <p className="text-sm text-amber-700 font-medium">PLEASE CHECK YOUR MEASUREMENTS</p>
          <p className="text-xs text-amber-600 mb-2">Customized orders are fulfilled according to the specifications submitted. Please ensure they are accurate.</p>
          <p className="text-xs text-slate-500 italic">Please note: ICONJ currently provides the products only. Installation is not included.</p>
        </div>
        
        {/* Actions */}`;

if (content.includes(actionsHeader)) {
    content = content.replace(actionsHeader, customMessage);
} else {
    // If we can't find Actions, let's just insert before the quantity selector.
    content = content.replace(
        '<div className="flex items-center gap-4 mb-8">',
        customMessage + '\n        <div className="flex items-center gap-4 mb-8">'
    );
}

fs.writeFileSync(file, content);
console.log('Done modifying ProductDetailsClient.tsx');
