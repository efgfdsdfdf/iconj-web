import { requireAdmin, createClient } from "@/lib/supabase/server";
import { DDPDashboardClient } from "./DDPDashboardClient";

export const metadata = { title: "DDP Management | ICONJ Admin" };

export default async function DDPManagementPage() {
  await requireAdmin();
  const supabase = await createClient();

  // 1. Fetch all products with their current DDP estimates
  const { data: products } = await supabase
    .from('products')
    .select(`
      id, name, sku, alibaba_url, base_supplier_cost,
      ddp_safety_buffer,
      ddp_estimates (*)
    `);

  // We filter in JS to avoid complex Supabase syntax for "not in"
  const activeProducts = products || [];
  activeProducts.forEach(p => {
    // Only keep the current estimate in the object
    p.current_estimate = p.ddp_estimates?.find((e: any) => e.is_current) || null;
  });

  const awaitingEstimates = activeProducts.filter(p => !p.current_estimate);
  const activeEstimates = activeProducts.filter(p => p.current_estimate);

  // 2. Fetch actual DDPs
  const { data: actuals } = await supabase
    .from('order_actual_ddp')
    .select('*, orders(id, paystack_reference, created_at)')
    .order('created_at', { ascending: false })
    .limit(50);

  // 3. Fetch supplier deposits
  const { data: deposits } = await supabase
    .from('supplier_deposits')
    .select('*')
    .order('created_at', { ascending: false });
  const depositBalance = deposits && deposits.length > 0 ? deposits[0].balance_after : 0;

  // 4. Fetch orders awaiting DDP (orders that are fulfilled but have no actual_ddp)
  // For simplicity, we just fetch recent orders. The admin can search by Order ID.
  const { data: recentOrders } = await supabase.from('orders').select('id, paystack_reference').order('created_at', { ascending: false }).limit(20);

  return (
    <DDPDashboardClient 
      awaitingEstimates={awaitingEstimates} 
      activeEstimates={activeEstimates} 
      actuals={actuals || []} 
      deposits={deposits || []}
      depositBalance={depositBalance}
      recentOrders={recentOrders || []}
    />
  );
}
