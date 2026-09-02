const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'src/app/admin/orders/[id]/page.tsx');
let content = fs.readFileSync(file, 'utf8');

// Import SupplierStatusPanel
content = content.replace(
  /import \{ SupplierExceptionManager \} from "\.\/components\/SupplierExceptionManager";/,
  `import { SupplierExceptionManager } from "./components/SupplierExceptionManager";\nimport { SupplierStatusPanel } from "./components/SupplierStatusPanel";`
);

// Inject SupplierStatusPanel
content = content.replace(
  /<SupplierExceptionManager orderId=\{order\.id\} currentIssues=\{issues\} \/>/,
  `<SupplierStatusPanel order={order} />\n            <SupplierExceptionManager orderId={order.id} currentIssues={issues} />`
);

fs.writeFileSync(file, content);
console.log('Done modifying admin order page 2');
