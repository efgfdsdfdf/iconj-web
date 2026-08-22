const fs = require('fs');
let content = fs.readFileSync('src/components/layout/Navbar.tsx', 'utf8');

const newCheckAuth = \
      const checkAuth = async () => {
        // 1. INSTANT LOCAL CHECK (0ms delay) - Instantly updates the sidebar
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUserEmail(session.user.email || null);
          if (session.user.user_metadata?.full_name) {
            setUserName(session.user.user_metadata.full_name.split(" ")[0]);
          } else {
            setUserName(session.user.email ? session.user.email.split("@")[0] : "User");
          }
        }

        // 2. BACKGROUND NETWORK CHECK - Syncs the cloud cart and verifies profile
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase.from("profiles").select("name, cart").eq("id", user.id).single();
          if (profile && profile.name) {
            setUserName(profile.name.split(" ")[0]);
          }

          // Cloud Cart Sync Down
          if (profile?.cart && Array.isArray(profile.cart) && profile.cart.length > 0) {
            const currentLocalCart = useCartStore.getState().items;
            if (currentLocalCart.length === 0) {
              setItems(profile.cart);
            } else {
              // Push local cart up if they started shopping before logging in
              fetch('/api/cart/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: currentLocalCart })
              }).catch(console.error);
            }
          }
        }
      };\;

content = content.replace(/const checkAuth = async \(\) => \{[\s\S]*?\}\s*\n\s*\}\s*\n\s*\};\n/, newCheckAuth + '\n');

fs.writeFileSync('src/components/layout/Navbar.tsx', content, 'utf8');
