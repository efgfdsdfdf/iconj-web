const fs = require('fs');
let content = fs.readFileSync('src/app/api/checkout/route.ts', 'utf8');

const saveLogic = \
    // If the user checked out with a new address and they are logged in, save it to their profile
    if (body.saveAddress && userId) {
      await supabaseAdmin.from('profiles').update({
        address_street: body.address?.street,
        address_city: body.address?.city,
        address_state: body.address?.state,
        phone: body.phone
      }).eq('id', userId);
    }
\;

content = content.replace(
  \// 2. Save the pending order to the database\,
  saveLogic + \\n    // 2. Save the pending order to the database\
);

fs.writeFileSync('src/app/api/checkout/route.ts', content, 'utf8');
