const fs = require('fs');
let content = fs.readFileSync('src/app/admin/layout.tsx', 'utf8');

if (!content.includes('/admin/support')) {
  content = content.replace(
    '{ href: "/admin/issues", icon: AlertCircle, label: "Issues" },',
    '{ href: "/admin/issues", icon: AlertCircle, label: "Issues" },\n    { href: "/admin/support", icon: MessageCircle, label: "Live Support" },'
  );
  
  content = content.replace(
    'Package, Users, Image, HelpCircle, Truck, AlertCircle',
    'Package, Users, Image, HelpCircle, Truck, AlertCircle, MessageCircle'
  );

  fs.writeFileSync('src/app/admin/layout.tsx', content, 'utf8');
}
