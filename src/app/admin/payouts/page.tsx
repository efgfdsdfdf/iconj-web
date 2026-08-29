import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/auth/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, CheckCircle2, XCircle, Clock, AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { PayoutActions } from './PayoutActions';

export const revalidate = 0;

export default async function AdminPayoutsPage() {
  await requireAdmin();

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: requestsData } = await supabaseAdmin
    .from('withdrawal_requests')
    .select(`
      *,
      sellers (
        id,
        businesses (
          business_name
        ),
        profiles (
          full_name,
          email
        )
      )
    `)
    .order('created_at', { ascending: false });

  const requests = requestsData || [];

  const { data: walletSettings } = await supabaseAdmin
    .from('wallet_settings')
    .select('*')
    .single();

  const payoutMode = walletSettings?.payout_mode || 'MANUAL';

  const pending = requests.filter(r => r.status === 'PENDING');
  const inProgress = requests.filter(r => r.status === 'APPROVED' || r.status === 'PROCESSING');
  const completed = requests.filter(r => r.status === 'COMPLETED');
  const rejected = requests.filter(r => r.status === 'REJECTED' || r.status === 'FAILED');

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const paidThisMonth = completed
    .filter(r => {
      const d = new Date(r.processed_at || r.created_at);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, r) => sum + Number(r.amount), 0);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Seller Payouts</h1>
        <p className="text-muted-foreground mt-2">
          Current Payout Mode: <span className="font-semibold">{payoutMode}</span>
        </p>
      </div>

      {payoutMode === 'MANUAL' && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                You are in MANUAL payout mode. Approved withdrawals will not be automatically transferred. You must manually transfer funds to the seller's bank account and then click "Mark as Paid".
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pending.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgress.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid This Month</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{paidThisMonth.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Pending Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {pending.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending requests.</p>
            ) : (
              <div className="space-y-4">
                {pending.map(req => (
                  <div key={req.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border rounded-lg gap-4">
                    <div>
                      <p className="font-semibold">{req.sellers?.profiles?.full_name} ({req.sellers?.businesses?.[0]?.business_name})</p>
                      <p className="text-sm text-muted-foreground">Amount: ₦{Number(req.amount).toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">Bank: {req.bank_name} - {req.account_number} ({req.account_name})</p>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(req.created_at).toLocaleString()}</p>
                    </div>
                    <PayoutActions request={req} walletSettings={walletSettings} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            {inProgress.length === 0 ? (
              <p className="text-sm text-muted-foreground">No in-progress requests.</p>
            ) : (
              <div className="space-y-4">
                {inProgress.map(req => (
                  <div key={req.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border rounded-lg gap-4">
                    <div>
                      <p className="font-semibold">{req.sellers?.profiles?.full_name}</p>
                      <p className="text-sm text-muted-foreground">Amount: ₦{Number(req.amount).toLocaleString()}</p>
                      <span className="inline-block mt-1 text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">{req.status}</span>
                    </div>
                    <PayoutActions request={req} walletSettings={walletSettings} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Completed Payouts</CardTitle>
          </CardHeader>
          <CardContent>
            {completed.length === 0 ? (
              <p className="text-sm text-muted-foreground">No completed payouts.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-muted text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Seller</th>
                      <th className="px-4 py-3">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completed.map(req => (
                      <tr key={req.id} className="border-b">
                        <td className="px-4 py-3">{new Date(req.processed_at || req.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3">{req.sellers?.profiles?.full_name}</td>
                        <td className="px-4 py-3">₦{Number(req.amount).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
