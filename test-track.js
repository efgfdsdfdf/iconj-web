require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testTrack() {
  const { data: orders } = await supabaseAdmin.from('orders').select('id').limit(1);
  if (!orders || orders.length === 0) return;
  const orderId = orders[0].id;
  
  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .select("*, order_items(*, products(name, images))")
    .eq("id", orderId)
    .single();

  if (error) {
    console.error("Order Query failed:", error);
    return;
  }

  const { data: events, error: eventError } = await supabaseAdmin
    .from("order_events")
    .select("id, event_type, description, created_at")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });

  if (eventError) {
    console.error("Events Query failed:", eventError);
  } else {
    order.order_events = events || [];
    console.log("Success! Events fetched:", events.length);
  }
}

testTrack();
