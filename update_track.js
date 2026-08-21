const fs = require('fs');
let content = fs.readFileSync('src/app/track/page.tsx', 'utf8');

// Insert useEffect to grab the order ID from the URL and auto-trigger tracking
content = content.replace(
  'const supabase = createClient();',
  \const supabase = createClient();
  
  import { useEffect } from "react";
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (id && !orderId) {
      setOrderId(id);
      // Auto submit logic
      const fetchOrder = async () => {
        setLoading(true);
        const { data, error } = await supabase.from("orders").select("*").eq("id", id).single();
        if (error || !data) {
          setError("We couldn't find an order with that ID.");
        } else {
          setOrder(data);
        }
        setLoading(false);
      };
      fetchOrder();
    }
  }, []);\
);

fs.writeFileSync('src/app/track/page.tsx', content, 'utf8');
