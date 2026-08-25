require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkPolicies() {
  const { data: policies, error } = await supabase.rpc('get_policies', {});
  if (error) {
    console.error("Error with RPC, trying SQL via a query...");
    // Just fetch it manually if no RPC exists
    const { data: qData, error: qError } = await supabase.from('pg_policies').select('*').eq('tablename', 'profiles');
    if (qError) {
        console.log("Could not query pg_policies via REST, skipping.");
    } else {
        console.log("Policies on profiles:", qData);
    }
  } else {
    console.log(policies);
  }
}

checkPolicies();
