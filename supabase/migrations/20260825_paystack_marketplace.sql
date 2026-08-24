-- 1. Modify Seller Payout Accounts to support Paystack Verification & Subaccounts
ALTER TABLE public.seller_payout_accounts
ADD COLUMN bank_code TEXT,
ADD COLUMN paystack_subaccount_code TEXT,
ADD COLUMN verified_name TEXT,
ADD COLUMN status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'VERIFIED', 'FAILED', 'PLATFORM_UPGRADE_REQUIRED'));

-- 2. Create the Immutable Financial Ledger
CREATE TABLE IF NOT EXISTS public.financial_ledger (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    seller_id UUID REFERENCES public.sellers(id),
    order_id UUID REFERENCES public.orders(id),
    paystack_reference TEXT,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN (
        'SALE_GROSS', 
        'DELIVERY_FEE', 
        'ICONJ_COMMISSION', 
        'SELLER_EARNING', 
        'SETTLEMENT_PENDING', 
        'SETTLEMENT_SUCCESSFUL', 
        'SETTLEMENT_FAILED', 
        'REFUND', 
        'ADJUSTMENT'
    )),
    amount DECIMAL(12, 2) NOT NULL,
    currency TEXT DEFAULT 'NGN',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure idempotency for webhooks
    UNIQUE(paystack_reference, transaction_type, seller_id)
);

-- RLS for Financial Ledger
ALTER TABLE public.financial_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view own ledger" ON public.financial_ledger 
FOR SELECT USING (
    seller_id IN (SELECT id FROM public.sellers WHERE profile_id = auth.uid())
);

CREATE POLICY "Admins manage ledger" ON public.financial_ledger 
FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
);
