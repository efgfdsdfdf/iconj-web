const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'src/app/admin/orders/[id]/page.tsx');
let content = fs.readFileSync(file, 'utf8');

// Replace "Order Items" header with "Customer Customization"
content = content.replace(
  /<CardTitle className="text-lg">Order Items<\/CardTitle>/,
  '<CardTitle className="text-lg">Customer Customization & Order Specs</CardTitle>'
);

// We'll leave the mapping inside mostly intact, just ensuring it renders properly.
// The user also wants to see the Delivery Address clearly.
// It's already there in the "Right Column" -> "Delivery Info".
fs.writeFileSync(file, content);
console.log('Done modifying admin order page 3');
