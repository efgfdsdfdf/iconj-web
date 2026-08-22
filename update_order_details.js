const fs = require('fs');
let content = fs.readFileSync('src/app/admin/orders/[id]/page.tsx', 'utf8');

content = content.replace(
  'if (!order) return notFound();',
  \if (!order) return notFound();\n\n  if (!order.is_read) {\n    await supabaseAdmin.from("orders").update({ is_read: true }).eq("id", order.id);\n  }\
);

fs.writeFileSync('src/app/admin/orders/[id]/page.tsx', content, 'utf8');
