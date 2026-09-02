const fs = require('fs');

// Layout
let layoutPath = 'src/app/layout.tsx';
let layoutContent = fs.readFileSync(layoutPath, 'utf8');
layoutContent = layoutContent.replace(
  'title: "ICONJ - Premium Blinds, Curtains & Window Treatments"',
  'title: "ICONJ - Customizable Blinds, Curtains & Window Accessories"'
);
layoutContent = layoutContent.replace(
  'description: "Custom-fitted blinds, elegant curtains, and smart window treatments tailored for your home and office in Nigeria."',
  'description: "Shop customizable window décor online. Custom blinds, tailored curtains, and window accessories in Nigeria, ordered your way."'
);
fs.writeFileSync(layoutPath, layoutContent);

// Page
let pagePath = 'src/app/page.tsx';
let pageContent = fs.readFileSync(pagePath, 'utf8');
pageContent = pageContent.replace(
  /title: 'ICONJ \\?\" Blinds, Curtains & Window Solutions'/,
  "title: 'ICONJ - Customizable Blinds & Curtains in Nigeria'"
);
pageContent = pageContent.replace(
  /description: 'Shop stylish blinds, curtains and window solutions on ICONJ\. Transform your home or office with window treatments designed for comfort, privacy and style\.'/,
  "description: 'ICONJ: Your space, your style. Customizable blinds, curtains & window accessories in Nigeria, ordered your way.'"
);
fs.writeFileSync(pagePath, pageContent);

console.log('Updated SEO metadata');
