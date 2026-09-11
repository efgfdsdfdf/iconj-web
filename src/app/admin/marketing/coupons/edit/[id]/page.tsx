import { requireAdmin, createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { EditCouponClient } from "./EditCouponClient";

export default async function EditCouponPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const resolvedParams = await params;
  const supabase = await createClient();
  
  const { data: coupon, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('id', resolvedParams.id)
    .single();

  if (error || !coupon) return notFound();

  return <EditCouponClient coupon={coupon} />;
}
