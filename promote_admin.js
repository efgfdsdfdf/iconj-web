const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function promoteAdmin() {
  console.log("Looking for user: ezeilodavid292@gmail.com");
  
  // 1. Get user by email via admin API
  const { data: { users }, error: fetchError } = await supabase.auth.admin.listUsers();
  if (fetchError) return console.error("Error fetching users:", fetchError);

  const user = users.find(u => u.email === "ezeilodavid292@gmail.com");
  if (!user) return console.log("User not found!");

  console.log("Found user ID:", user.id);

  // 2. Update profiles table
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", user.id);

  if (updateError) {
    console.error("Error updating profile:", updateError);
  } else {
    console.log("SUCCESS: User promoted to Admin in Supabase DB!");
  }
}

promoteAdmin();
