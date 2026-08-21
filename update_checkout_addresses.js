const fs = require('fs');
let content = fs.readFileSync('src/app/checkout/page.tsx', 'utf8');

// 1. We have to fetch addresses instead of profile.address_street
content = content.replace(
  'supabase.from("profiles").select("*").eq("id", data.user.id).single().then(({ data: profile }) => {',
  \supabase.from("profiles").select("*").eq("id", data.user.id).single().then(({ data: profile }) => {
          if (profile) {
            setFormData(prev => ({ 
              ...prev, 
              email: profile.email || data.user?.email || "",
              phone: profile.phone || "",
              firstName: profile.name ? profile.name.split(' ')[0] : "",
              lastName: profile.name ? profile.name.split(' ').slice(1).join(' ') : ""
            }));
          } else {
             setFormData(prev => ({ ...prev, email: data.user?.email || "" }));
          }
        });
        
        supabase.from("addresses").select("*").eq("user_id", data.user.id).order("is_default", { ascending: false }).limit(1).then(({ data: addresses }) => {
          if (addresses && addresses.length > 0) {
            const addr = addresses[0];
            setSavedAddress({
              street: addr.street,
              city: addr.city,
              state: addr.state
            });
            setUseSavedAddress(true);
          }
        });\
);

// We have to remove the old address logic from the profile block
content = content.replace(
  \            if (profile.address_street) {
              setSavedAddress({
                street: profile.address_street,
                city: profile.address_city,
                state: profile.address_state
              });
              setUseSavedAddress(true);
            }
          } else {
             setFormData(prev => ({ ...prev, email: data.user?.email || "" }));
          }
        });\,
  \\
);

fs.writeFileSync('src/app/checkout/page.tsx', content, 'utf8');
