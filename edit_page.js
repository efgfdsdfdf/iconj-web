const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'src/app/page.tsx');
let content = fs.readFileSync(file, 'utf8');

// Update main hero
content = content.replace(
  'Beautiful Windows. Better Spaces.',
  'YOUR SPACE. YOUR STYLE.'
);
content = content.replace(
  'Transform Your Windows.<br className="hidden sm:block" /> Transform Your Space.',
  'Customizable blinds, curtains & window accessories,<br className="hidden sm:block" /> ordered your way.'
);
content = content.replace(
  'Discover stylish blinds, curtains and window solutions designed to give your home or office the perfect finish.',
  'Choose your preferred style, colour, size and available options. Provide your specifications and we\'ll coordinate your customized order for fulfillment and delivery.'
);

// Update CTA
content = content.replace(
  /<Link href="\/shop"[\s\S]*?>[\s\S]*?Shop All Products[\s\S]*?<\/Link>/,
  '<Link href="/shop?category=blinds">\n                <Button size="lg" className="bg-amber-600 hover:bg-amber-700 text-white font-bold h-14 px-8 rounded-full text-lg shadow-[0_0_20px_rgba(217,119,6,0.4)] transition-all hover:scale-105">\n                  Shop Blinds <ArrowRight className="ml-2 w-5 h-5" />\n                </Button>\n              </Link>\n              <Link href="/shop?category=curtains">\n                <Button size="lg" className="bg-white/10 hover:bg-white/20 text-white font-bold h-14 px-8 rounded-full text-lg backdrop-blur-sm border border-white/20 transition-all">\n                  Shop Curtains\n                </Button>\n              </Link>'
);

// Add customize section and update How ICONJ works
// Let's find "Not Sure Which One to Choose?" and "How It Works"
content = content.replace(
  'How ICONJ Works',
  'CUSTOMIZE IT YOUR WAY'
);
content = content.replace(
  'Simple, transparent and hassle-free.',
  'Every space is different. Choose the product you love, select your preferred options and provide your measurements and requirements. ICONJ coordinates your customized order based on the specifications you provide.'
);

// Replacing the 4 steps with the 5 steps
content = content.replace(
  /\{\s*num:\s*'01'[\s\S]*?'Transform'[\s\S]*?'Enjoy a better-looking space.'\s*\}/g,
  `{ num: '01', title: 'CHOOSE', desc: 'Browse our collection of blinds, curtains and window accessories.' },
                { num: '02', title: 'CUSTOMIZE', desc: 'Select your preferred colour, size, style and other available options.' },
                { num: '03', title: 'PROVIDE SPECS', desc: 'Enter your measurements and any additional customization requirements.' },
                { num: '04', title: 'WE COORDINATE', desc: 'ICONJ sends your specifications to the appropriate supplier for fulfillment.' },
                { num: '05', title: 'RECEIVE', desc: 'Your customized order is prepared and delivered to you.' }`
);
content = content.replace(
  /grid-cols-2 md:grid-cols-4/g,
  'grid-cols-2 md:grid-cols-5'
);

fs.writeFileSync(file, content);
console.log('Done modifying page.tsx');
