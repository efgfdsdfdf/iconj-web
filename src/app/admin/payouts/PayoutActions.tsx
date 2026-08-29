'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { approveWithdrawal, rejectWithdrawal, markWithdrawalPaid } from './actions';

interface PayoutActionsProps {
  request: any;
  walletSettings: any;
}

export function PayoutActions({ request, walletSettings }: PayoutActionsProps) {
  const router = useRouter();
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isMarkingPaid, setIsMarkingPaid] = useState(false);

  const handleApprove = async () => {
    setIsApproving(true);
    const toastId = toast.loading('Approving...');
    try {
      const res = await approveWithdrawal(request.id);
      if (res.success) {
        toast.success('Approved successfully', { id: toastId });
        router.refresh();
      } else {
        toast.error(res.error || 'Failed to approve', { id: toastId });
      }
    } catch (e: any) {
      toast.error(e.message || 'Error approving', { id: toastId });
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    const reason = window.prompt('Enter reason for rejection:');
    if (reason === null) return; // user cancelled

    setIsRejecting(true);
    const toastId = toast.loading('Rejecting...');
    try {
      const res = await rejectWithdrawal(request.id, reason || 'No reason provided');
      if (res.success) {
        toast.success('Rejected successfully', { id: toastId });
        router.refresh();
      } else {
        toast.error(res.error || 'Failed to reject', { id: toastId });
      }
    } catch (e: any) {
      toast.error(e.message || 'Error rejecting', { id: toastId });
    } finally {
      setIsRejecting(false);
    }
  };

  const handleMarkPaid = async () => {
    setIsMarkingPaid(true);
    const toastId = toast.loading('Marking as paid...');
    try {
      const res = await markWithdrawalPaid(request.id);
      if (res.success) {
        toast.success('Marked as paid', { id: toastId });
        router.refresh();
      } else {
        toast.error(res.error || 'Failed to mark as paid', { id: toastId });
      }
    } catch (e: any) {
      toast.error(e.message || 'Error marking as paid', { id: toastId });
    } finally {
      setIsMarkingPaid(false);
    }
  };

  if (request.status === 'PENDING') {
    return (
      <div className="flex gap-2">
        <Button 
          onClick={handleApprove} 
          disabled={isApproving || isRejecting}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          {isApproving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Approve
        </Button>
        <Button 
          variant="destructive" 
          onClick={handleReject} 
          disabled={isApproving || isRejecting}
        >
          {isRejecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Reject
        </Button>
      </div>
    );
  }

  if (request.status === 'APPROVED' && (!walletSettings?.payout_mode || walletSettings.payout_mode === 'MANUAL')) {
    return (
      <Button 
        onClick={handleMarkPaid} 
        disabled={isMarkingPaid}
        className="bg-blue-600 hover:bg-blue-700 text-white"
      >
        {isMarkingPaid && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Mark as Paid
      </Button>
    );
  }

  if (request.status === 'PROCESSING') {
    return (
      <Button disabled variant="outline">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Processing...
      </Button>
    );
  }

  if (request.status === 'COMPLETED') {
    return (
      <div className="flex items-center text-green-600 bg-green-50 px-3 py-1 rounded-full text-sm font-medium">
        <CheckCircle2 className="mr-1 h-4 w-4" />
        Completed
      </div>
    );
  }

  if (request.status === 'REJECTED') {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center text-red-600 bg-red-50 px-3 py-1 rounded-full text-sm font-medium">
          <XCircle className="mr-1 h-4 w-4" />
          Rejected
        </div>
        {request.admin_note && (
          <span className="text-xs text-muted-foreground">Reason: {request.admin_note}</span>
        )}
      </div>
    );
  }

  if (request.status === 'FAILED') {
    return (
      <div className="flex items-center text-red-600 bg-red-50 px-3 py-1 rounded-full text-sm font-medium">
        <XCircle className="mr-1 h-4 w-4" />
        Failed
      </div>
    );
  }

  return null;
}
