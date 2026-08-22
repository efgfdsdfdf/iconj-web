const fs = require('fs');
let content = fs.readFileSync('src/components/layout/Navbar.tsx', 'utf8');

content = content.replace(
  \    checkAuth();
  }, [supabase, setItems]);\,
  \    checkAuth();

    // Listen for login/logout events across tabs or from the login page!
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUserEmail(session.user.email || null);
        if (session.user.user_metadata?.full_name) {
          setUserName(session.user.user_metadata.full_name.split(" ")[0]);
        } else {
          setUserName(session.user.email ? session.user.email.split("@")[0] : "User");
        }
      } else {
        setUserName(null);
        setUserEmail(null);
      }
    });

    return () => { subscription.unsubscribe(); };
  }, [supabase, setItems]);\
);

fs.writeFileSync('src/components/layout/Navbar.tsx', content, 'utf8');
