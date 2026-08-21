const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function fix() {
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const user = users.find(u => u.email === "ezeilodavid292@gmail.com");
  if (!user) return console.log("User not found");
  
  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    role: "admin",
    name: "David Ezeilo",
    email: user.email
  });
  if (error) console.log("ERROR:", error);
  else console.log("SUCCESS");
}
fix();
