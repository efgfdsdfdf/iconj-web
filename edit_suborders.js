const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'src/app/admin/orders/[id]/components/SellerSubOrdersPanel.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /<option value="PROCESSING">Processing<\/option>/,
  `<option value="PROCESSING">Customization Confirmed / In Fulfillment</option>\n                        <option value="READY_FOR_PICKUP">Ready for Delivery</option>`
);

fs.writeFileSync(file, content);
console.log('Done modifying SellerSubOrdersPanel.tsx');
