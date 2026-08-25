require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testQuery() {
  const userId = 'da75b8cd-579c-4073-8888-9c28d67aa7dd';
  
  console.log("Testing exact layout query...");
  const { data: seller, error } = await supabase
    .from("sellers")
    .select("*, stores(store_name)")
    .eq("profile_id", userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
    
  console.log("Data:", seller);
  console.log("Error:", error);
}

testQuery();
