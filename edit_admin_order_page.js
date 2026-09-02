const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'src/app/admin/orders/[id]/page.tsx');
let content = fs.readFileSync(file, 'utf8');

// Import Exception Manager
content = content.replace(
  /import \{ CopyToSupplierButton \} from "\.\/CopyToSupplierButton";/,
  `import { CopyToSupplierButton } from "./CopyToSupplierButton";\nimport { SupplierExceptionManager } from "./components/SupplierExceptionManager";`
);

// Add the component above the SellerSubOrdersPanel
content = content.replace(
  /\{(\/\* THE NEW COMMAND CENTER \*\/)\}/,
  `<SupplierExceptionManager orderId={order.id} currentIssues={issues} />\n\n            {$1}`
);

fs.writeFileSync(file, content);
console.log('Done modifying admin order page');
