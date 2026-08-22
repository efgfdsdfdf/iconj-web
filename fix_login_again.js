const fs = require('fs');
let content = fs.readFileSync('src/app/(auth)/login/page.tsx', 'utf8');

content = content.replace(
  'import { createClient } from "@/lib/supabase/client";',
  'import { createClient } from "@/lib/supabase/client";\nimport { loginAction } from "./actions";'
);

content = content.replace(
  'const handleLogin = async (e: React.FormEvent) => {\\n    e.preventDefault();\\n    setLoading(true);\\n    setError(null);\\n    \\n    try {\\n      const { data, error: authError } = await supabase.auth.signInWithPassword({\\n        email: formData.email,\\n        password: formData.password,\\n      });\\n\\n      if (authError) throw authError;\\n\\n      toast.success("Successfully authenticated!");\\n      \\n      // Force a hard reload to ensure server cookies are recognized by Next.js\\n      window.location.href = redirectUrl;\\n    } catch (err: any) {\\n      setError(err.message || "Invalid login credentials.");\\n    } finally {\\n      setLoading(false);\\n    }\\n  };',
  \const handleLogin = async (e: React.FormEvent) => {\\n    e.preventDefault();\\n    setLoading(true);\\n    setError(null);\\n    \\n    const fd = new FormData();\\n    fd.append("email", formData.email);\\n    fd.append("password", formData.password);\\n    fd.append("redirectUrl", redirectUrl);\\n    \\n    const res = await loginAction(fd);\\n    if (res && res.error) {\\n      setError(res.error);\\n      setLoading(false);\\n    }\\n    // If successful, loginAction will redirect on the server!\\n  };\
);

fs.writeFileSync('src/app/(auth)/login/page.tsx', content, 'utf8');
