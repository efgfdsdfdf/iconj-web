require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY // Use anon key to test RLS
);

async function checkRoles() {
  // First login as the user to get their session/token
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'ezeilodavid292@gmail.com',
    password: 'password123' // I don't know the password...
  });
  
  // Okay, instead of logging in, I'll just use the service role key to see what's in the DB
}

checkRoles();
