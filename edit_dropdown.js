const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'src/app/seller/orders/SellerOrderStatusDropdown.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /const statuses = \[[\s\S]*?\];/,
  `const statuses = [
    { value: "PROCESSING", label: "Customization Confirmed / In Fulfillment" },
    { value: "READY_FOR_PICKUP", label: "Ready for Delivery" },
    { value: "SHIPPED", label: "Shipped" },
    { value: "DELIVERED", label: "Delivered" },
    { value: "CANCELLED", label: "Cancelled" }
  ];`
);

fs.writeFileSync(file, content);
console.log('Done modifying SellerOrderStatusDropdown');
