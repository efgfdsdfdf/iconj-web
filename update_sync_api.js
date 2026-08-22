const fs = require('fs');
let content = fs.readFileSync('src/app/api/cart/sync/route.ts', 'utf8');

content = content.replace(
  \    const { error } = await supabase
      .from("profiles")
      .update({ cart: items })
      .eq("id", user.id);\,
  \    // Store the cart inside the auth.users metadata JSONB to bypass the need for a profiles column
    const { error } = await supabase.auth.updateUser({
      data: { cart: items }
    });\
);

fs.writeFileSync('src/app/api/cart/sync/route.ts', content, 'utf8');
