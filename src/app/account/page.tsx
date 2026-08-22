import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, User, MapPin, Heart, Clock, ChevronRight, CheckCircle2, AlertCircle, MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "./LogoutButton";

export const revalidate = 0;

export default async function CustomerDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch profile to get the user's name
  const { data: profile } = await supabase.from("profiles").select("name").eq("id", user.id).single();
  const userName = profile?.name || user.user_metadata?.full_name || (user.email ? user.email.split("@")[0] : "Customer");

  // Fetch their most recent order
  const { data: activeOrder } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // Load addresses from auth metadata
  const rawAddresses = user.user_metadata?.addresses || [];
  const addresses = Array.isArray(rawAddresses) ? rawAddresses : [];
  const defaultAddress = addresses.find((a: any) => a.is_default) || addresses[0];

  return (
    <div className="bg-slate-50 min-h-screen pb-12">
      <div className="bg-white border-b shadow-sm mb-8">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-slate-900">My Account</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar Navigation */}
          <div className="w-full lg:w-64 shrink-0">
            <Card className="border-none shadow-sm overflow-hidden">
              <nav className="flex flex-col">
                <Link href="/account" className="flex items-center gap-3 px-4 py-3 bg-slate-100 border-l-4 border-orange-500 font-bold text-slate-900">
                  <User className="w-5 h-5 text-slate-500" /> Account Overview
                </Link>
                <Link href="/account/orders" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 border-l-4 border-transparent text-slate-700 font-medium border-t">
                  <Package className="w-5 h-5 text-slate-400" /> My Orders
                </Link>
                <Link href="/account/addresses" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 border-l-4 border-transparent text-slate-700 font-medium border-t">
                  <MapPin className="w-5 h-5 text-slate-400" /> Saved Addresses
                </Link>
                <Link href="/account/issues" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 border-l-4 border-transparent text-slate-700 font-medium border-t">
                  <AlertCircle className="w-5 h-5 text-slate-400" /> Returns & Issues
                </Link>
                <Link href="/account/support" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 border-l-4 border-transparent text-slate-700 font-medium border-t">
                  <MessageCircle className="w-5 h-5 text-slate-400" /> Contact Support
                </Link>
                <div className="p-4 border-t bg-slate-50">
                  <LogoutButton />
                </div>
              </nav>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1 space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-100 flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-2xl font-bold">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Welcome back, {userName}!</h2>
                <p className="text-slate-500">{user.email}</p>
              </div>
            </div>

            {/* Active Order Tracker */}
            {activeOrder ? (
              <Card className="border-none shadow-sm">
                <CardHeader className="border-b bg-slate-50/50 pb-4 flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Active Order Tracking</CardTitle>
                  <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded">Order #{activeOrder.id.split("-")[0].toUpperCase()}</span>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row gap-6 mb-8">
                    <div className="w-20 h-20 bg-slate-100 rounded border shrink-0 overflow-hidden flex items-center justify-center text-slate-300">
                      <Package className="w-8 h-8"/>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 mb-1">Your Order Items</h3>
                      <p className="text-sm font-medium text-slate-700 mb-2">Total Amount: ₦{Number(activeOrder.total_amount).toLocaleString()}</p>
                      <p className="text-sm font-medium text-slate-700">Status: <span className="text-emerald-600 font-bold uppercase">{activeOrder.order_status || "Pending"}</span></p>
                    </div>
                  </div>

                  {/* VISUAL TIMELINE */}
                  <div className="relative pt-2 pb-8 px-4">
                    {/* Progress Line */}
                    <div className="absolute top-6 left-8 right-8 h-1 bg-slate-200 rounded">
                      <div className={`h-full bg-emerald-500 rounded ${activeOrder.order_status === 'NEW' ? 'w-1/4' : activeOrder.order_status === 'PROCESSING' ? 'w-1/2' : activeOrder.order_status === 'SHIPPED' ? 'w-3/4' : 'w-full'}`}></div>
                    </div>
                    
                    <div className="relative z-10 flex justify-between">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center border-4 border-white shadow-sm"><CheckCircle2 className="w-5 h-5"/></div>
                        <span className="text-xs font-bold text-emerald-700 text-center">Placed</span>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-sm ${["PAYMENT_CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"].includes(activeOrder.order_status) ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-400"}`}><CheckCircle2 className="w-5 h-5"/></div>
                        <span className={`text-xs font-bold text-center ${["PAYMENT_CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"].includes(activeOrder.order_status) ? "text-emerald-700" : "text-slate-500"}`}>Paid</span>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-sm ${["PROCESSING", "SHIPPED", "DELIVERED"].includes(activeOrder.order_status) ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-400"}`}><Clock className="w-5 h-5"/></div>
                        <span className={`text-xs font-bold text-center ${["PROCESSING", "SHIPPED", "DELIVERED"].includes(activeOrder.order_status) ? "text-emerald-700" : "text-slate-500"}`}>Processing</span>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-sm ${["SHIPPED", "DELIVERED"].includes(activeOrder.order_status) ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-400"}`}><Package className="w-5 h-5"/></div>
                        <span className={`text-xs font-medium text-center ${["SHIPPED", "DELIVERED"].includes(activeOrder.order_status) ? "text-emerald-700 font-bold" : "text-slate-500"}`}>Shipped</span>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-sm ${activeOrder.order_status === "DELIVERED" ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-400"}`}><MapPin className="w-5 h-5"/></div>
                        <span className={`text-xs font-medium text-center ${activeOrder.order_status === "DELIVERED" ? "text-emerald-700 font-bold" : "text-slate-500"}`}>Delivered</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <Link href={`/track?id=${activeOrder.id}`}>
                      <Button variant="outline" size="sm" className="text-blue-600 hover:text-blue-700">
                        View Full Details <ChevronRight className="w-4 h-4 ml-1"/>
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-none shadow-sm bg-slate-50 border-dashed border-2">
                <CardContent className="py-12 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4"><Package className="w-8 h-8 text-slate-400"/></div>
                  <h3 className="text-lg font-bold text-slate-900">No Active Orders</h3>
                  <p className="text-slate-500 max-w-sm mt-1 mb-6">You don't have any pending or active orders being processed right now.</p>
                  <Link href="/shop"><Button className="bg-orange-500 hover:bg-orange-600">Start Shopping</Button></Link>
                </CardContent>
              </Card>
            )}

            <div className="grid sm:grid-cols-2 gap-6">
              <Card className="border-none shadow-sm">
                <CardHeader className="border-b bg-slate-50/50 pb-3">
                  <CardTitle className="text-base">Account Details</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 text-sm text-slate-600 space-y-1">
                  <p className="font-bold text-slate-900">{userName}</p>
                  <p>{user.email}</p>
                  <Link href="/forgot-password"><p className="pt-2 text-blue-600 hover:underline cursor-pointer">Change Password</p></Link>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm flex flex-col">
                <CardHeader className="border-b bg-slate-50/50 pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-base">Default Address</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 text-sm text-slate-600 space-y-1 flex-1">
                  {defaultAddress ? (
                    <>
                      <p className="font-bold text-slate-900">{defaultAddress.name}</p>
                      <p>{defaultAddress.street}</p>
                      <p>{defaultAddress.city}{defaultAddress.state ? `, ${defaultAddress.state}` : ''}</p>
                      <p>{defaultAddress.country || 'Nigeria'}</p>
                      {defaultAddress.phone && <p className="pt-1">{defaultAddress.phone}</p>}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center py-4">
                      <p className="text-slate-500 mb-2">No addresses saved yet</p>
                      <Link href="/account/addresses">
                        <Button variant="outline" size="sm">Add Address</Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
