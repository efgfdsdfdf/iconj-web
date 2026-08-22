const fs = require('fs');
let content = fs.readFileSync('src/components/layout/Navbar.tsx', 'utf8');

// 1. Add useRef to import
content = content.replace(
  'import { useEffect, useState } from "react";',
  'import { useEffect, useState, useRef } from "react";'
);

// 2. Remove tapCount state and replace with ref
content = content.replace(
  'const [tapCount, setTapCount] = useState(0);',
  'const tapCountRef = useRef({ count: 0, lastTap: 0 });'
);

// 3. Update handleAdminTap
content = content.replace(
  \  const handleAdminTap = (e: React.MouseEvent) => {
    if (userEmail === "ezeilodavid292@gmail.com") {
      e.preventDefault();
      e.stopPropagation();
      const newCount = tapCount + 1;
      setTapCount(newCount);
      if (newCount >= 5) {
        setTapCount(0);
        router.push("/admin");
      }
    }
  };\,
  \  const handleAdminTap = (e: React.MouseEvent) => {
    if (userEmail === "ezeilodavid292@gmail.com") {
      e.preventDefault();
      e.stopPropagation();
      const now = Date.now();
      if (now - tapCountRef.current.lastTap > 1000) {
        tapCountRef.current.count = 0;
      }
      tapCountRef.current.count += 1;
      tapCountRef.current.lastTap = now;
      
      if (tapCountRef.current.count >= 3) {
        tapCountRef.current.count = 0;
        router.push("/admin");
      }
    }
  };\
);

// 4. Inject Admin Link in Desktop dropdown
content = content.replace(
  '<Link href="/account" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Dashboard</Link>',
  \<Link href="/account" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Dashboard</Link>
                      {userEmail === "ezeilodavid292@gmail.com" && (
                        <Link href="/admin" className="block px-4 py-2 text-sm font-bold text-blue-700 hover:bg-blue-50">Admin Panel</Link>
                      )}\
);

// 5. Inject Admin Link in Mobile menu (before Log Out)
content = content.replace(
  \{userName && (
                  <button onClick={handleLogout} className="w-full text-left flex items-center gap-2 px-4 py-4 mt-4 bg-red-50 text-red-600 font-medium hover:bg-red-100 transition-colors">\,
  \{userEmail === "ezeilodavid292@gmail.com" && (
                  <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-3.5 hover:bg-blue-50 font-bold text-blue-700 border-b border-slate-100">Admin Panel</Link>
                )}
                
                {userName && (
                  <button onClick={handleLogout} className="w-full text-left flex items-center gap-2 px-4 py-4 mt-4 bg-red-50 text-red-600 font-medium hover:bg-red-100 transition-colors">\
);

fs.writeFileSync('src/components/layout/Navbar.tsx', content, 'utf8');
