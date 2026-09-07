/**
 * ICONJ Quotation Helpers
 *
 * Core business logic for the quotation system.
 * All functions are server-side only.
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ─── Admin-only fields (NEVER sent to customer) ──────────────────────────────
export const ADMIN_ONLY_FIELDS = [
  'supplier_product_cost',
  'supplier_customization_cost',
  'supplier_shipping_cost',
  'supplier_other_charges',
  'supplier_total_cost',
  'supplier_production_days',
  'supplier_delivery_days',
  'supplier_shipping_method',
  'supplier_moq',
  'supplier_spec_confirmed',
  'supplier_notes',
  'supplier_quoted_at',
  'supplier_quote_valid_until',
  'supplier_fulfillment_sent_by',
  'supplier_fulfillment_reference',
  'iconj_markup_amount',
  'iconj_markup_pct',
  'admin_notes',
  'access_token',
  'price_locked_at',
  'specs_locked_at',
  'fulfillment_blocked',
  'is_exception',
] as const;

/**
 * Strips all admin-only and internal fields from a quotation object
 * before returning it to a customer-facing API response.
 */
export function sanitizeQuotationForCustomer(quotation: any): any {
  if (!quotation) return null;
  const safe = { ...quotation };
  for (const field of ADMIN_ONLY_FIELDS) {
    delete safe[field];
  }
  // Also translate internal statuses to customer-friendly labels
  safe.status_label = getCustomerStatusLabel(quotation.status);
  return safe;
}

function getCustomerStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    REQUESTED: 'Reviewing Your Request',
    SUPPLIER_QUOTE_REQUESTED: 'Checking Product Availability',
    SUPPLIER_RESPONSE_RECEIVED: 'Preparing Your Quotation',
    SUPPLIER_SPEC_ISSUE: 'Checking Specification — We Will Contact You',
    QUOTE_BEING_PREPARED: 'Preparing Your Quotation',
    QUOTE_SENT: 'Quote Ready — Action Required',
    QUOTE_VIEWED: 'Quote Ready — Action Required',
    QUOTE_ACCEPTED: 'Accepted — Please Complete Payment',
    QUOTE_DECLINED: 'Quotation Declined',
    QUOTE_EXPIRED: 'Quotation Expired',
    PAYMENT_PENDING: 'Payment Processing',
    PAID: 'Payment Confirmed — Processing',
    CONVERTED_TO_ORDER: 'Order Created — In Progress',
  };
  return labels[status] || status;
}

// ─── Next Action ─────────────────────────────────────────────────────────────

/**
 * Returns a clear, specific instruction for what the admin should do next.
 * Shows "NO ACTION REQUIRED — SYSTEM WILL MONITOR" when nothing is needed.
 */
export function computeNextAction(quotation: any): string {
  if (quotation.fulfillment_blocked && quotation.is_exception) {
    return '🚨 BLOCKED: Resolve open exception before proceeding with fulfillment';
  }
  switch (quotation.status) {
    case 'REQUESTED':
      return 'Copy supplier request and mark as sent to supplier';
    case 'SUPPLIER_QUOTE_REQUESTED':
      return 'NO ACTION REQUIRED — SYSTEM WILL MONITOR';
    case 'SUPPLIER_RESPONSE_RECEIVED':
      return 'Review supplier response and generate customer quotation';
    case 'SUPPLIER_SPEC_ISSUE':
      return '⚠️ URGENT: Supplier spec conflict — contact customer with alternatives';
    case 'QUOTE_BEING_PREPARED':
      return 'Review customer price and send quotation';
    case 'QUOTE_SENT':
    case 'QUOTE_VIEWED':
      return 'NO ACTION REQUIRED — SYSTEM WILL REMIND CUSTOMER AUTOMATICALLY';
    case 'QUOTE_ACCEPTED':
      return 'NO ACTION REQUIRED — WAITING FOR CUSTOMER PAYMENT';
    case 'PAYMENT_PENDING':
      return 'NO ACTION REQUIRED — WAITING FOR PAYMENT CONFIRMATION';
    case 'PAID':
      if (quotation.supplier_fulfillment_status === 'NOT_SUBMITTED') {
        return '🟢 URGENT: Copy supplier fulfillment order and mark as submitted';
      }
      return 'NO ACTION REQUIRED — SYSTEM WILL MONITOR';
    case 'CONVERTED_TO_ORDER':
      if (quotation.supplier_fulfillment_status === 'NOT_SUBMITTED') {
        return '🟢 URGENT: Submit fulfillment order to supplier';
      }
      return 'Order created — manage in the Orders section';
    case 'QUOTE_DECLINED':
      return 'Quotation declined by customer — no action required';
    case 'QUOTE_EXPIRED':
      return 'Quote expired — contact customer to create new quotation if needed';
    default:
      return 'Review quotation status';
  }
}

// ─── Priority ────────────────────────────────────────────────────────────────

export function computePriority(quotation: any): 'URGENT' | 'NORMAL' | 'NO_ACTION' {
  // Exceptions always URGENT
  if (quotation.is_exception) return 'URGENT';

  switch (quotation.status) {
    case 'PAID':
    case 'SUPPLIER_SPEC_ISSUE':
      return 'URGENT';
    case 'SUPPLIER_RESPONSE_RECEIVED':
    case 'QUOTE_BEING_PREPARED':
      return 'URGENT';
    case 'CONVERTED_TO_ORDER':
      if (quotation.supplier_fulfillment_status === 'NOT_SUBMITTED') return 'URGENT';
      return 'NO_ACTION';
    case 'REQUESTED':
      return 'NORMAL';
    case 'SUPPLIER_QUOTE_REQUESTED':
    case 'QUOTE_SENT':
    case 'QUOTE_VIEWED':
    case 'QUOTE_ACCEPTED':
    case 'PAYMENT_PENDING':
      return 'NO_ACTION';
    case 'QUOTE_DECLINED':
    case 'QUOTE_EXPIRED':
      return 'NO_ACTION';
    default:
      return 'NORMAL';
  }
}

// ─── Price Calculation ───────────────────────────────────────────────────────

export function autoCalculateCustomerPrice(
  supplierTotal: number,
  markupPct: number
): { customerPrice: number; markupAmount: number } {
  const markupAmount = Math.round(supplierTotal * (markupPct / 100) * 100) / 100;
  const customerPrice = Math.round((supplierTotal + markupAmount) * 100) / 100;
  return { customerPrice, markupAmount };
}

// ─── Timeline Logging ────────────────────────────────────────────────────────

export async function logQuotationEvent(
  quotationId: string,
  eventType: string,
  description: string,
  performedBy: 'admin' | 'customer' | 'system' = 'system',
  metadata: Record<string, any> = {}
): Promise<void> {
  try {
    await supabase.from('quotation_events').insert({
      quotation_id: quotationId,
      event_type: eventType,
      description,
      performed_by: performedBy,
      metadata,
    });
  } catch (err) {
    // Never let timeline logging crash the main operation
    console.error('Failed to log quotation event:', err);
  }
}

// ─── Post-Payment Lock Check ─────────────────────────────────────────────────

export function isPostPaymentLocked(quotation: any): boolean {
  return !!(quotation.price_locked_at || quotation.specs_locked_at);
}

// ─── Post-Payment Exception Creation ─────────────────────────────────────────

export async function createPostPaymentException(
  quotationId: string,
  exceptionType: string,
  description: string,
  oldValue?: any,
  newValue?: any
): Promise<void> {
  // Create exception record
  await supabase.from('quotation_exceptions').insert({
    quotation_id: quotationId,
    exception_type: exceptionType,
    description,
    old_value: oldValue ? JSON.stringify(oldValue) : null,
    new_value: newValue ? JSON.stringify(newValue) : null,
    status: 'OPEN',
  });

  // Mark quotation as having an exception and block fulfillment
  await supabase
    .from('quotations')
    .update({
      is_exception: true,
      fulfillment_blocked: true,
      priority: 'URGENT',
    })
    .eq('id', quotationId);

  // Log timeline event
  await logQuotationEvent(
    quotationId,
    'EXCEPTION_CREATED',
    `${exceptionType}: ${description}`,
    'system'
  );
}

// ─── Quotation → Order Conversion ────────────────────────────────────────────

/**
 * Atomically converts a paid quotation into exactly one order.
 * IDEMPOTENT: safe to call multiple times — returns existing order if already converted.
 * DB UNIQUE constraint on converted_order_id provides final safety net.
 */
export async function convertQuotationToOrder(quotationId: string): Promise<{
  orderId: string;
  wasAlreadyConverted: boolean;
}> {
  // Fetch quotation with all data
  const { data: quotation, error: fetchError } = await supabase
    .from('quotations')
    .select('*')
    .eq('id', quotationId)
    .single();

  if (fetchError || !quotation) {
    throw new Error(`Cannot convert: quotation ${quotationId} not found`);
  }

  // IDEMPOTENCY: Already converted — return existing order
  if (quotation.converted_order_id) {
    return { orderId: quotation.converted_order_id, wasAlreadyConverted: true };
  }

  // Must be PAID to convert
  if (quotation.payment_status !== 'PAID') {
    throw new Error(`Cannot convert: quotation ${quotationId} is not PAID (status: ${quotation.payment_status})`);
  }

  // Create the order record using locked specifications and agreed price
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: quotation.user_id,
      payment_status: 'PAID',
      order_status: 'PROCESSING',
      logistics_status: 'ORDER_RECEIVED',
      subtotal: quotation.customer_price,
      shipping_cost: quotation.customer_shipping || 0,
      total_amount: quotation.customer_total,
      delivery_address: {
        name: quotation.customer_name,
        phone: quotation.customer_phone,
        email: quotation.customer_email,
        ...quotation.delivery_location,
      },
      // Store quotation reference for admin visibility
      notes: `Converted from quotation ${quotation.reference}`,
      admin_viewed: false,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (orderError || !order) {
    throw new Error(`Failed to create order from quotation: ${orderError?.message}`);
  }

  // Create the order item (locked specifications from accepted quotation)
  await supabase.from('order_items').insert({
    order_id: order.id,
    product_id: quotation.product_id,
    quantity: quotation.quantity,
    unit_price: quotation.customer_price,
    total_price: quotation.customer_total,
    configuration_details: {
      product_name: quotation.product_name,
      quotation_reference: quotation.reference,
      // These are the LOCKED specs (frozen at payment time)
      ...quotation.specifications,
      delivery_location: quotation.delivery_location,
      customer_notes: quotation.customer_notes,
      // Store supplier info in config for admin reference (not shown to customers)
      _admin: {
        supplier_product_cost: quotation.supplier_product_cost,
        supplier_customization_cost: quotation.supplier_customization_cost,
        supplier_shipping_cost: quotation.supplier_shipping_cost,
        supplier_total_cost: quotation.supplier_total_cost,
        supplier_production_days: quotation.supplier_production_days,
        supplier_delivery_days: quotation.supplier_delivery_days,
        supplier_shipping_method: quotation.supplier_shipping_method,
        iconj_markup_pct: quotation.iconj_markup_pct,
        iconj_markup_amount: quotation.iconj_markup_amount,
      },
    },
  });

  // Link quotation to order (DB UNIQUE prevents duplicates at this point)
  const { error: linkError } = await supabase
    .from('quotations')
    .update({
      converted_order_id: order.id,
      converted_at: new Date().toISOString(),
      status: 'CONVERTED_TO_ORDER',
      next_action: computeNextAction({ ...quotation, status: 'CONVERTED_TO_ORDER', supplier_fulfillment_status: 'NOT_SUBMITTED' }),
      priority: 'URGENT',
    })
    .eq('id', quotationId)
    .is('converted_order_id', null); // Extra guard: only update if not already linked

  if (linkError) {
    // If this fails due to unique constraint, another concurrent request already converted it
    // Re-fetch and return the existing order
    const { data: refetched } = await supabase
      .from('quotations')
      .select('converted_order_id')
      .eq('id', quotationId)
      .single();
    if (refetched?.converted_order_id) {
      return { orderId: refetched.converted_order_id, wasAlreadyConverted: true };
    }
    throw new Error(`Failed to link order to quotation: ${linkError.message}`);
  }

  // Log timeline
  await logQuotationEvent(
    quotationId,
    'ORDER_CREATED',
    `Order ${order.id.split('-')[0].toUpperCase()} created automatically from paid quotation`,
    'system',
    { order_id: order.id }
  );

  return { orderId: order.id, wasAlreadyConverted: false };
}

// ─── Fulfillment Block Check ─────────────────────────────────────────────────

/**
 * Returns true if fulfillment should be blocked due to open exceptions.
 * Admin must explicitly resolve all open exceptions before fulfillment.
 */
export async function checkFulfillmentBlock(quotationId: string): Promise<{
  blocked: boolean;
  openExceptions: any[];
}> {
  const { data: exceptions } = await supabase
    .from('quotation_exceptions')
    .select('*')
    .eq('quotation_id', quotationId)
    .eq('status', 'OPEN');

  const openExceptions = exceptions || [];
  const blocked = openExceptions.length > 0;

  // Keep fulfillment_blocked in sync
  if (!blocked) {
    await supabase
      .from('quotations')
      .update({ fulfillment_blocked: false })
      .eq('id', quotationId);
  }

  return { blocked, openExceptions };
}

// ─── Paystack Server-Side Verification ──────────────────────────────────────

/**
 * SAFEGUARD 3: Verify Paystack transaction server-side before marking quotation PAID.
 * Never trust the client-supplied amount or status.
 */
export async function verifyPaystackTransaction(reference: string, expectedAmountKobo: number, expectedCurrency: string = 'NGN'): Promise<{
  valid: boolean;
  error?: string;
  data?: any;
}> {
  try {
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const result = await response.json();

    if (!result.status || !result.data) {
      return { valid: false, error: 'Paystack verification failed: no data' };
    }

    const txn = result.data;

    if (txn.status !== 'success') {
      return { valid: false, error: `Transaction status is not success: ${txn.status}` };
    }

    if (txn.currency !== expectedCurrency) {
      return { valid: false, error: `Currency mismatch: expected ${expectedCurrency}, got ${txn.currency}` };
    }

    // Amount tolerance: allow ±1 kobo for floating point, but reject any meaningful difference
    if (Math.abs(txn.amount - expectedAmountKobo) > 1) {
      return {
        valid: false,
        error: `Amount mismatch: expected ${expectedAmountKobo} kobo, got ${txn.amount} kobo`,
      };
    }

    return { valid: true, data: txn };
  } catch (err: any) {
    return { valid: false, error: `Paystack verification error: ${err.message}` };
  }
}

// ─── Default Markup from Settings ────────────────────────────────────────────

export async function getDefaultMarkupPct(): Promise<number> {
  try {
    const { data } = await supabase
      .from('store_settings')
      .select('value')
      .eq('id', 'quotation_markup_pct')
      .single();
    return parseFloat(data?.value || '30');
  } catch {
    return 30; // Safe fallback
  }
}

export async function getQuoteValidityDays(): Promise<number> {
  try {
    const { data } = await supabase
      .from('store_settings')
      .select('value')
      .eq('id', 'quote_validity_days')
      .single();
    return parseInt(data?.value || '7');
  } catch {
    return 7;
  }
}

export async function getPaymentGraceHours(): Promise<number> {
  try {
    const { data } = await supabase
      .from('store_settings')
      .select('value')
      .eq('id', 'quote_payment_grace_hours')
      .single();
    return parseInt(data?.value || '24');
  } catch {
    return 24;
  }
}
