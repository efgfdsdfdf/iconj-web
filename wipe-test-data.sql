-- Copy and paste this entire block into the Supabase SQL Editor and click RUN

-- 1. Temporarily disable security triggers so we can delete financial ledgers
SET session_replication_role = 'replica';

-- 2. Wipe all transactional test data
DELETE FROM order_emails;
DELETE FROM order_events;
DELETE FROM admin_notes;
DELETE FROM logistics_issues;
DELETE FROM order_items;
DELETE FROM wallet_transactions;
DELETE FROM commissions;
DELETE FROM seller_orders;
DELETE FROM supplier_transactions;
DELETE FROM financial_ledger;
DELETE FROM support_messages;
DELETE FROM orders;
DELETE FROM cart_items;
DELETE FROM admin_notifications;

-- 3. Reset all seller wallet balances back to 0
UPDATE seller_wallets 
SET available_balance = 0, 
    pending_balance = 0, 
    reserved_balance = 0, 
    refund_liability = 0, 
    total_earned = 0, 
    total_withdrawn = 0;

-- 4. Turn the security triggers back on!
SET session_replication_role = 'origin';
