'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { requestWithdrawal } from './actions';

interface WithdrawFormProps {
  bankName: string;
  accountNumber: string;
  accountName: string;
  minAmount: number;
  maxAmount: number;
}

export default function WithdrawForm({
  bankName,
  accountNumber,
  accountName,
  minAmount,
  maxAmount,
}: WithdrawFormProps) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const amount = Number(formData.get('amount'));
    
    if (amount < minAmount) {
      toast.error(`Minimum withdrawal is ₦${minAmount.toLocaleString()}`);
      setLoading(false);
      return;
    }
    
    if (amount > maxAmount) {
      toast.error(`Maximum withdrawal is ₦${maxAmount.toLocaleString()}`);
      setLoading(false);
      return;
    }

    try {
      const result = await requestWithdrawal(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Withdrawal request submitted successfully');
        (e.target as HTMLFormElement).reset();
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-muted p-4 rounded-md">
        <p className="text-sm text-muted-foreground">Withdraw to:</p>
        <p className="font-medium">{bankName} - {accountNumber}</p>
        <p className="text-sm">{accountName}</p>
      </div>

      <div className="space-y-2">
        <label htmlFor="amount" className="text-sm font-medium">
          Amount (₦)
        </label>
        <input
          id="amount"
          name="amount"
          type="number"
          min={minAmount}
          max={maxAmount}
          step="0.01"
          required
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder={`Min: ₦${minAmount.toLocaleString()}`}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full"
      >
        {loading ? 'Processing...' : 'Request Withdrawal'}
      </button>
    </form>
  );
}
