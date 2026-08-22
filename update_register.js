const fs = require('fs');
let content = fs.readFileSync('src/app/(auth)/register/page.tsx', 'utf8');

content = content.replace(
  \      const { data, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: \\\$\\{formData.firstName\\} \\$\\{formData.lastName\\}\
          }
        }
      });\,
  \      const { data, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: \\\$\\{window.location.origin\\}/welcome\,
          data: {
            full_name: \\\$\\{formData.firstName\\} \\$\\{formData.lastName\\}\
          }
        }
      });\
);

content = content.replace(
  \      // Automatically sign them in as well or redirect to account
      router.push("/account");
      router.refresh();\,
  \      if (data.session) {
        router.push("/welcome");
      } else {
        // Supabase sends a confirmation email if the session is null
        router.push("/verify-email");
      }
      router.refresh();\
);

fs.writeFileSync('src/app/(auth)/register/page.tsx', content, 'utf8');
