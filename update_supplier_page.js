const fs = require('fs');
let content = fs.readFileSync('src/app/admin/supplier/page.tsx', 'utf8');

if (!content.includes('MarkSupplierPaidButton')) {
  content = content.replace(
    'import { ImportTrackingButton } from "./ImportTrackingButton";',
    'import { ImportTrackingButton } from "./ImportTrackingButton";\nimport { MarkSupplierPaidButton } from "./MarkSupplierPaidButton";'
  );

  content = content.replace(
    \  const { data: orders } = await supabaseAdmin
    .from("orders")
    .select("*, order_items(*, products(*)), profiles(name, email)")
    .eq("payment_status", "paid")
    .in("order_status", ["in_production", "processing"])
    .order("created_at", { ascending: true });\,
    \  const { data: allOrders } = await supabaseAdmin
    .from("orders")
    .select("*, order_items(*, products(*)), profiles(name, email)")
    .eq("payment_status", "paid")
    .in("order_status", ["in_production", "processing"])
    .order("created_at", { ascending: true });

  const orders = allOrders?.filter(o => o.supplier_paid !== true) || [];\
  );

  content = content.replace(
    '<CopyOrderButton order={order} />',
    '<CopyOrderButton order={order} />\n                      <MarkSupplierPaidButton orderId={order.id} />'
  );

  fs.writeFileSync('src/app/admin/supplier/page.tsx', content, 'utf8');
}
