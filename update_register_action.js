const fs = require('fs');
let content = fs.readFileSync('src/app/(auth)/register/page.tsx', 'utf8');

if (!content.includes('notifyAdminNewUser')) {
  content = content.replace('import { createClient } from "@/lib/supabase/client";', 'import { createClient } from "@/lib/supabase/client";\nimport { notifyAdminNewUser } from "./actions";');
  
  content = content.replace(
    '      if (authError) {',
    \      // Notify admin
      await notifyAdminNewUser(\\\\ \\\\, formData.email).catch(console.error);

      if (authError) {\
  );
}

fs.writeFileSync('src/app/(auth)/register/page.tsx', content, 'utf8');
