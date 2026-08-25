const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
  const { data: prods } = await supabase.from('products').select('id, name');
  console.log("Products:", prods?.length);
  if (prods && prods.length > 0) {
    const id = prods[0].id;
    const { data, error } = await supabase
      .from("products")
      .select("*, stores(store_name, slug), inventory(available_quantity), wholesale_pricing(*)")
      .eq("id", id)
      .single();
    
    console.log("Error:", error);
    console.log("Data:", !!data);
  }
}

test();
