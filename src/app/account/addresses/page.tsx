import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, User, MapPin, Heart, Clock, AlertCircle, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { addAddress, deleteAddress, setDefaultAddress } from "./actions";
import { AddressForm } from "./AddressForm";
import { AddressList } from "./AddressList";

export const revalidate = 0;

export default async function AddressesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: addresses } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <div className="bg-slate-50 min-h-screen pb-12">
      <div className="bg-white border-b shadow-sm mb-8">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-slate-900">My Addresses</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar Navigation */}
          <div className="w-full lg:w-64 shrink-0">
            <Card className="border-none shadow-sm overflow-hidden">
              <nav className="flex flex-col">
                <Link href="/account" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 border-l-4 border-transparent text-slate-700 font-medium">
                  <User className="w-5 h-5 text-slate-500" /> Account Overview
                </Link>
                <Link href="/account/orders" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 border-l-4 border-transparent text-slate-700 font-medium border-t">
                  <Package className="w-5 h-5 text-slate-400" /> My Orders
                </Link>
                <Link href="/account/addresses" className="flex items-center gap-3 px-4 py-3 bg-slate-100 border-l-4 border-orange-500 font-bold text-slate-900 border-t">
                  <MapPin className="w-5 h-5 text-orange-500" /> Saved Addresses
                </Link>
                <Link href="/account/issues" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 border-l-4 border-transparent text-slate-700 font-medium border-t">
                  <AlertCircle className="w-5 h-5 text-slate-400" /> Returns & Issues
                </Link>
              </nav>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Address Book</h2>
                <p className="text-sm text-slate-500">Manage your delivery addresses for faster checkout.</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <AddressList addresses={addresses || []} />
              
              <Card className="border-none shadow-sm bg-white h-fit">
                <CardHeader className="border-b pb-4 bg-slate-50/50">
                  <CardTitle className="text-base flex items-center"><Plus className="w-4 h-4 mr-2"/> Add New Address</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <AddressForm />
                </CardContent>
              </Card>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
