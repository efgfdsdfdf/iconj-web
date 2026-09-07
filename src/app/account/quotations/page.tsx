import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, FileText, Truck, CheckCircle2, Clock, User, MapPin, AlertCircle, MessageCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LogoutButton } from "../LogoutButton";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "My Quotations | ICONJ",
};

export const revalidate = 0;

function getCustomerStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    REQUESTED: 'Reviewing Your Request',
    SUPPLIER_QUOTE_REQUESTED: 'Checking Availability',
    SUPPLIER_RESPONSE_RECEIVED: 'Preparing Your Quote',
    SUPPLIER_SPEC_ISSUE: 'Checking Specifications',
    QUOTE_BEING_PREPARED: 'Preparing Your Quote',
    QUOTE_SENT: 'Quote Ready — Action Required',
    QUOTE_VIEWED: 'Quote Ready — Action Required',
    QUOTE_ACCEPTED: 'Accepted — Please Pay',
    QUOTE_DECLINED: 'Declined',
    QUOTE_EXPIRED: 'Expired',
    PAYMENT_PENDING: 'Payment Processing',
    PAID: 'Paid — In Progress',
    CONVERTED_TO_ORDER: 'Order Created',
  };
  return labels[status] || status;
}

function getStatusColor(status: string) {
  switch(status) {
    case 'QUOTE_SENT':
    case 'QUOTE_VIEWED':
      return "bg-blue-100 text-blue-800 border-blue-200";
    case 'QUOTE_ACCEPTED':
      return "bg-amber-100 text-amber-800 border-amber-200";
    case 'PAID':
    case 'CONVERTED_TO_ORDER':
      return "bg-green-100 text-green-800 border-green-200";
    case 'QUOTE_DECLINED':
    case 'QUOTE_EXPIRED':
      return "bg-slate-100 text-slate-800 border-slate-200";
    default:
      return "bg-indigo-50 text-indigo-700 border-indigo-100";
  }
}

export default async function CustomerQuotationsPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/account/quotations");
  }

  const { data: quotations } = await supabase
    .from('quotations')
    .select('id, reference, product_name, quantity, status, customer_total, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="bg-slate-50 min-h-screen pb-12">
      <div className="bg-white border-b shadow-sm mb-8">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-slate-900">My Quotations</h1>
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
                <Link href="/account/quotations" className="flex items-center gap-3 px-4 py-3 bg-slate-100 border-l-4 border-blue-500 font-bold text-slate-900 border-t">
                  <FileText className="w-5 h-5 text-blue-500" /> My Quotations
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
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-500">Track and manage your custom quotation requests.</p>
              <Link href="/quote">
                <Button>Request New Quote</Button>
              </Link>
            </div>

            <div className="space-y-4">
              {!quotations || quotations.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-lg border shadow-sm">
                  <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-slate-900 mb-2">No quotations yet</h3>
                  <p className="text-slate-500 mb-6">You haven't requested any custom quotations.</p>
                  <Link href="/quote">
                    <Button className="bg-blue-600 hover:bg-blue-700">Request a Quote</Button>
                  </Link>
                </div>
              ) : (
                <div className="grid gap-4">
                  {quotations.map((q) => (
                    <Card key={q.id} className="hover:shadow-md transition-shadow">
                      <Link href={`/account/quotations/${q.id}`} className="block">
                        <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <span className="font-semibold text-lg text-slate-900">{q.reference}</span>
                              <Badge variant="outline" className={getStatusColor(q.status)}>
                                {getCustomerStatusLabel(q.status)}
                              </Badge>
                            </div>
                            <h3 className="text-slate-600 font-medium">{q.product_name} <span className="text-slate-400 font-normal">(x{q.quantity})</span></h3>
                            <div className="flex items-center text-sm text-slate-400">
                              <Clock className="w-3.5 h-3.5 mr-1" />
                              {new Date(q.created_at).toLocaleDateString('en-NG')}
                            </div>
                          </div>

                          <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                            {q.customer_total && (
                              <div className="text-right">
                                <span className="text-xs text-slate-500 uppercase tracking-wider block">Total</span>
                                <span className="font-bold text-lg text-slate-900">
                                  ₦{Number(q.customer_total).toLocaleString('en-NG')}
                                </span>
                              </div>
                            )}
                            <div className="text-blue-600 hidden sm:flex items-center font-medium">
                              View <ArrowRight className="w-4 h-4 ml-1" />
                            </div>
                          </div>
                        </CardContent>
                      </Link>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
