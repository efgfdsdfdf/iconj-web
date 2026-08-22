const fs = require('fs');
let content = fs.readFileSync('src/components/layout/Navbar.tsx', 'utf8');

// Add setItems to the useCartStore hook call
content = content.replace(
  'const items = useCartStore((state) => state.items);',
  'const items = useCartStore((state) => state.items);\n  const setItems = useCartStore((state) => state.setItems);'
);

// Modify the checkAuth to fetch and set cart
content = content.replace(
  'const { data: profile } = await supabase.from("profiles").select("name").eq("id", user.id).single();',
  \const { data: profile } = await supabase.from("profiles").select("name, cart").eq("id", user.id).single();
        
        // Load cart from cloud if local is empty
        if (profile?.cart && Array.isArray(profile.cart) && profile.cart.length > 0) {
          const currentLocalCart = useCartStore.getState().items;
          if (currentLocalCart.length === 0) {
            useCartStore.getState().setItems(profile.cart);
          } else if (currentLocalCart.length > 0) {
            // If local has items, upload them immediately to override cloud
            fetch('/api/cart/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ items: currentLocalCart })
            }).catch(console.error);
          }
        }\
);

// Add the upload effect hook
content = content.replace(
  'useEffect(() => { setIsMobileMenuOpen(false); }, [pathname]);',
  \useEffect(() => { setIsMobileMenuOpen(false); }, [pathname]);

  // Auto-sync cart to cloud whenever items change
  useEffect(() => {
    if (userEmail && mounted) {
      const timer = setTimeout(() => {
        fetch('/api/cart/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items })
        }).catch(console.error);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [items, userEmail, mounted]);\
);

fs.writeFileSync('src/components/layout/Navbar.tsx', content, 'utf8');
