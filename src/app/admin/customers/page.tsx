import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { createClient } from "@supabase/supabase-js";
import { UserCircle } from "lucide-react";

export const revalidate = 0;

export default async function AdminCustomersPage() {
  const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  // Fetch profiles (customers)
  const { data: profiles, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  // Fetch all orders to calculate total spent per user
  const { data: orders } = await supabaseAdmin
    .from('orders')
    .select('user_id, total_amount');

  return (
    <main className="flex-1 p-4 md:p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
          <p className="text-sm text-slate-500">Manage registered customers on the platform.</p>
        </div>
      </div>
      <Card className="border-none shadow-sm overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="pl-6 py-4">Customer Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Total Orders</TableHead>
                <TableHead>Total Spent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles && profiles.length > 0 ? (
                profiles.map((profile) => {
                  const userOrders = orders?.filter(o => o.user_id === profile.id) || [];
                  const totalSpent = userOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
                  
                  return (
                    <TableRow key={profile.id} className="hover:bg-slate-50/50">
                      <TableCell className="pl-6 font-medium">
                        <div className="flex items-center gap-2">
                          <UserCircle className="w-8 h-8 text-slate-300" />
                          {profile.name || 'Unknown'}
                        </div>
                      </TableCell>
                      <TableCell>{profile.email}</TableCell>
                      <TableCell>
                        <span className={px-2 py-1 rounded text-xs font-medium  + (profile.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700')}>
                          {profile.role || 'customer'}
                        </span>
                      </TableCell>
                      <TableCell>{userOrders.length}</TableCell>
                      <TableCell className="font-bold text-emerald-600">?{totalSpent.toLocaleString()}</TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                    No customers found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
