const fs = require('fs');
let content = fs.readFileSync('src/components/layout/Navbar.tsx', 'utf8');

if (!content.includes('SearchBar')) {
  content = content.replace(
    'import { ShoppingCart, Menu, User, Search, Package, X, Phone, HelpCircle, ChevronDown, Heart, LogOut } from "lucide-react";',
    'import { ShoppingCart, Menu, User, Search, Package, X, Phone, HelpCircle, ChevronDown, Heart, LogOut } from "lucide-react";\nimport { SearchBar } from "@/components/SearchBar";'
  );

  content = content.replace(
    /<div className="relative w-full flex">[\s\S]*?<\/div>\n\s*<\/div>/,
    '<SearchBar />\n          </div>'
  );

  content = content.replace(
    /<div className="md:hidden px-4 pb-3">[\s\S]*?<\/div>\n\s*<\/div>/,
    '<div className="md:hidden px-4 pb-3">\n            <SearchBar isMobile={true} />\n          </div>'
  );

  fs.writeFileSync('src/components/layout/Navbar.tsx', content, 'utf8');
}
