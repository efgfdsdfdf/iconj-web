import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, ArrowUpRight, ArrowDownRight, Clock, CheckCircle2 } from 'lucide-react';
import WithdrawForm from './WithdrawForm';
import Link from 'next/link';
import { ensureWalletExists } from '@/lib/wallet';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function WalletPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: seller } = await supabase
    .from('sellers')
    .select('id')
    .eq('profile_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!seller) {
    redirect('/account');
  }

  let wallet: any = null;
  try {
    wallet = await ensureWalletExists(seller.id);
  } catch (err) {
    const { data } = await supabase
      .from('seller_wallets')
      .select('*')
      .eq('seller_id', seller.id)
      .maybeSingle();
    wallet = data;
  }

  const { data: transactions } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('seller_id', seller.id)
    .order('created_at', { ascending: false })
    .limit(20);

  const { data: settings } = await supabase
    .from('wallet_settings')
    .select('min_withdrawal_amount, hold_period_days')
    .limit(1)
    .single();

  const { data: payoutAccount } = await supabase
    .from('seller_payout_accounts')
    .select('*')
    .eq('seller_id', seller.id)
    .eq('is_primary', true)
    .single();

  const { data: pendingWithdrawals } = await supabase
    .from('withdrawal_requests')
    .select('*')
    .eq('seller_id', seller.id)
    .in('status', ['PENDING', 'APPROVED', 'PROCESSING']);

  const minWithdrawal = settings?.min_withdrawal_amount || 0;
  const hasPendingWithdrawal = pendingWithdrawals && pendingWithdrawals.length > 0;
  const activeWithdrawal = hasPendingWithdrawal ? pendingWithdrawals[0] : null;

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-8">
      <h1 className="text-3xl font-bold">My Wallet</h1>

      {wallet?.refund_liability > 0 && (
        <div className="bg-destructive/15 text-destructive p-4 rounded-lg flex items-center">
          <p className="font-medium">
            You have a refund liability of ₦{wallet.refund_liability.toLocaleString()}. This will be deducted from your next earnings.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
            <Wallet className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₦{wallet?.available_balance?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Cleared funds ready for withdrawal.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Balance</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">
              ₦{wallet?.pending_balance?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              Funds from new orders are held in escrow and will become available for withdrawal <strong>{settings?.hold_period_days || 2} days</strong> after you mark the order as DELIVERED.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reserved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-500">
              ₦{wallet?.reserved_balance?.toLocaleString() || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₦{wallet?.total_earned?.toLocaleString() || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Withdraw Funds</CardTitle>
            </CardHeader>
            <CardContent>
              {!payoutAccount ? (
                <div className="text-center py-6 space-y-4">
                  <p className="text-muted-foreground">No primary payout account linked.</p>
                  <Link 
                    href="/seller/payouts"
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                  >
                    Setup Payout Account
                  </Link>
                </div>
              ) : hasPendingWithdrawal ? (
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <p className="font-medium text-sm">Active Withdrawal Request</p>
                  <p className="text-2xl font-bold">₦{activeWithdrawal.amount.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground uppercase">{activeWithdrawal.status}</p>
                </div>
              ) : (
                <WithdrawForm
                  bankName={payoutAccount.bank_name}
                  accountNumber={`****${payoutAccount.account_number.slice(-4)}`}
                  accountName={payoutAccount.account_name}
                  minAmount={minWithdrawal}
                  maxAmount={wallet?.available_balance || 0}
                />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {transactions && transactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 rounded-tl-lg">Date</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Description</th>
                        <th className="px-4 py-3 rounded-tr-lg text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx: any) => (
                        <tr key={tx.id} className="border-b last:border-0">
                          <td className="px-4 py-3 whitespace-nowrap">
                            {new Date(tx.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              tx.type === 'CREDIT' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {tx.type}
                            </span>
                          </td>
                          <td className="px-4 py-3">{tx.description}</td>
                          <td className={`px-4 py-3 text-right font-medium whitespace-nowrap ${
                            tx.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {tx.type === 'CREDIT' ? '+' : '-'}₦{Math.abs(tx.amount).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-6">No recent transactions</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
