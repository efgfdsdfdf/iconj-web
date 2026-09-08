/**
 * ICONJ DDP Shipping Engine
 * src/lib/shipping.ts
 *
 * Core stateless calculation engine.
 * NEVER guesses — returns explicit status when data is missing.
 * supplier_ddp_cost and markup amounts are NEVER returned from public APIs.
 */

import { createClient } from '@supabase/supabase-js';

const getAdminClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

// ============================================================
// Types
// ============================================================

export type ShippingCalculationStatus =
  | 'ESTIMATED'          // calculated, but supplier formula not yet confirmed
  | 'FORMULA_CONFIRMED'  // supplier's divisor + formula confirmed — calculation trusted
  | 'CUSTOM_REQUIRED'    // custom size, cannot reliably calculate
  | 'MISSING_DATA'       // product has no weight/dimensions at all
  | 'PARTIAL_DATA'       // product has weight but no dimensions (volumetric skipped)
  | 'NO_RATES'           // no active DDP rates configured yet

export type ChargeableWeightMethod = 'MAX' | 'ACTUAL_ONLY' | 'VOLUMETRIC_ONLY';
export type RoundingMethod = 'CEIL_0.5' | 'CEIL_1' | 'ROUND' | 'NONE';

export interface ShippingSettings {
  volumetricDivisor: number | null;         // null = pending supplier confirmation
  divisorStatus: 'CONFIRMED' | 'PENDING_CONFIRMATION';
  formulaStatus: 'CONFIRMED' | 'PENDING_CONFIRMATION';
  chargeableWeightMethod: ChargeableWeightMethod;
  markupPct: number;                         // e.g. 10 = 10%
  defaultOrigin: string;
  defaultDestination: string;
  roundingMethod: RoundingMethod;
}

export interface DDPRate {
  id: string;
  weightMinKg: number;
  weightMaxKg: number | null;
  ratePerKg: number | null;
  flatRate: number | null;
  rateType: 'per_kg' | 'flat';
  currency: string;
  destination: string;
  shippingMethod: string;
  formulaConfirmed: boolean;
  effectiveFrom: string;
  effectiveTo: string | null;
}

export interface ProductShippingData {
  id: string;
  shippingWeightKg: number | null;
  shippingLengthCm: number | null;
  shippingWidthCm: number | null;
  shippingHeightCm: number | null;
  shippingDataStatus: 'MISSING' | 'PARTIAL' | 'COMPLETE' | 'CUSTOM_REQUIRED';
  isConfigurable?: boolean; // custom-measurement product
}

export interface ShippingCalculationResult {
  status: ShippingCalculationStatus;
  // Customer-facing (safe to return from public APIs)
  customerShippingPrice: number;
  currency: string;
  label: string;       // e.g. "Estimated DDP Shipping"
  note: string;        // explanatory text for customer
  // Internal breakdown (NEVER return from public APIs)
  _internal?: {
    actualWeightKg: number | null;
    volumetricWeightKg: number | null;
    chargeableWeightKg: number | null;
    totalChargeableWeightKg: number | null;
    volumetricDivisorUsed: number | null;
    divisorConfirmed: boolean;
    formulaConfirmed: boolean;
    supplierDDPCost: number;
    markupPct: number;
    markupAmount: number;
    rateId: string | null;
    rateSnapshot: DDPRate | null;
  };
}

export interface CartItemForShipping {
  productId: string;
  quantity: number;
  // Optional overrides (for custom-size products)
  customWeightKg?: number;
  customLengthCm?: number;
  customWidthCm?: number;
  customHeightCm?: number;
  isCustomSize?: boolean;
}

export interface CartShippingResult {
  worstStatus: ShippingCalculationStatus;
  totalCustomerShipping: number;
  currency: string;
  items: Array<{ productId: string; result: ShippingCalculationResult }>;
  blocksCheckout: boolean;
  blocksCheckoutReason?: string;
}

// ============================================================
// Settings
// ============================================================

let _settingsCache: ShippingSettings | null = null;
let _settingsCacheTime = 0;
const SETTINGS_CACHE_MS = 60_000; // 1 minute cache

export async function getShippingSettings(): Promise<ShippingSettings> {
  const now = Date.now();
  if (_settingsCache && now - _settingsCacheTime < SETTINGS_CACHE_MS) {
    return _settingsCache;
  }

  const supabase = getAdminClient();
  const { data } = await supabase
    .from('store_settings')
    .select('id, value')
    .in('id', [
      'ddp_volumetric_divisor',
      'ddp_divisor_status',
      'ddp_formula_status',
      'ddp_chargeable_weight_method',
      'ddp_shipping_markup_pct',
      'ddp_default_origin',
      'ddp_default_destination',
      'ddp_rounding_method',
    ]);

  const map: Record<string, any> = {};
  for (const row of data || []) {
    try { map[row.id] = JSON.parse(row.value); } catch { map[row.id] = row.value; }
  }

  _settingsCache = {
    volumetricDivisor: map['ddp_volumetric_divisor'] ?? null,
    divisorStatus: map['ddp_divisor_status'] ?? 'PENDING_CONFIRMATION',
    formulaStatus: map['ddp_formula_status'] ?? 'PENDING_CONFIRMATION',
    chargeableWeightMethod: map['ddp_chargeable_weight_method'] ?? 'MAX',
    markupPct: Number(map['ddp_shipping_markup_pct'] ?? 10),
    defaultOrigin: map['ddp_default_origin'] ?? 'China',
    defaultDestination: map['ddp_default_destination'] ?? 'Nigeria',
    roundingMethod: map['ddp_rounding_method'] ?? 'CEIL_0.5',
  };
  _settingsCacheTime = now;

  return _settingsCache;
}

export function invalidateSettingsCache() {
  _settingsCache = null;
  _settingsCacheTime = 0;
}

// ============================================================
// Rate lookup
// ============================================================

export async function getActiveDDPRates(
  destination = 'Nigeria',
  method = 'DDP'
): Promise<DDPRate[]> {
  const supabase = getAdminClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('ddp_rates')
    .select('*')
    .eq('destination', destination)
    .eq('shipping_method', method)
    .eq('is_active', true)
    .or(`effective_to.is.null,effective_to.gt.${now}`)
    .lte('effective_from', now)
    .order('weight_min_kg', { ascending: true });

  if (error || !data) return [];

  return data.map((r: any) => ({
    id: r.id,
    weightMinKg: Number(r.weight_min_kg),
    weightMaxKg: r.weight_max_kg != null ? Number(r.weight_max_kg) : null,
    ratePerKg: r.rate_per_kg != null ? Number(r.rate_per_kg) : null,
    flatRate: r.flat_rate != null ? Number(r.flat_rate) : null,
    rateType: r.rate_type,
    currency: r.currency,
    destination: r.destination,
    shippingMethod: r.shipping_method,
    formulaConfirmed: r.formula_confirmed,
    effectiveFrom: r.effective_from,
    effectiveTo: r.effective_to,
  }));
}

// ============================================================
// Weight calculations (pure functions)
// ============================================================

export function calculateVolumetricWeight(
  lengthCm: number,
  widthCm: number,
  heightCm: number,
  divisor: number
): number {
  return (lengthCm * widthCm * heightCm) / divisor;
}

export function roundChargeableWeight(
  weight: number,
  method: RoundingMethod
): number {
  switch (method) {
    case 'CEIL_0.5': return Math.ceil(weight * 2) / 2;
    case 'CEIL_1':   return Math.ceil(weight);
    case 'ROUND':    return Math.round(weight * 10) / 10;
    case 'NONE':
    default:         return weight;
  }
}

export function calculateChargeableWeight(
  actualKg: number,
  volumetricKg: number | null,
  method: ChargeableWeightMethod
): number {
  switch (method) {
    case 'ACTUAL_ONLY':     return actualKg;
    case 'VOLUMETRIC_ONLY': return volumetricKg ?? actualKg;
    case 'MAX':
    default:
      return volumetricKg != null ? Math.max(actualKg, volumetricKg) : actualKg;
  }
}

export function findApplicableRate(
  chargeableWeightKg: number,
  rates: DDPRate[]
): DDPRate | null {
  // Find the bracket that contains this weight
  for (const rate of rates) {
    const aboveMin = chargeableWeightKg >= rate.weightMinKg;
    const belowMax = rate.weightMaxKg == null || chargeableWeightKg <= rate.weightMaxKg;
    if (aboveMin && belowMax) return rate;
  }
  return null;
}

export function applyRate(chargeableWeightKg: number, rate: DDPRate): number {
  if (rate.rateType === 'flat' && rate.flatRate != null) {
    return rate.flatRate;
  }
  if (rate.rateType === 'per_kg' && rate.ratePerKg != null) {
    return chargeableWeightKg * rate.ratePerKg;
  }
  return 0;
}

// ============================================================
// Product shipping status helper
// ============================================================

export function getProductShippingStatus(product: {
  shipping_weight_kg?: number | null;
  shipping_length_cm?: number | null;
  shipping_width_cm?: number | null;
  shipping_height_cm?: number | null;
  is_configurable?: boolean;
  shipping_data_status?: string;
}): 'MISSING' | 'PARTIAL' | 'COMPLETE' | 'CUSTOM_REQUIRED' {
  if (product.is_configurable) return 'CUSTOM_REQUIRED';
  if (!product.shipping_weight_kg) return 'MISSING';
  if (
    !product.shipping_length_cm ||
    !product.shipping_width_cm ||
    !product.shipping_height_cm
  ) return 'PARTIAL';
  return 'COMPLETE';
}

// ============================================================
// Label helpers
// ============================================================

function buildLabel(settings: ShippingSettings, rate: DDPRate | null): string {
  const formulaConfirmed =
    settings.formulaStatus === 'CONFIRMED' &&
    settings.divisorStatus === 'CONFIRMED' &&
    rate?.formulaConfirmed === true;

  return formulaConfirmed ? 'DDP Shipping' : 'Estimated DDP Shipping';
}

function buildNote(settings: ShippingSettings, rate: DDPRate | null): string {
  const formulaConfirmed =
    settings.formulaStatus === 'CONFIRMED' &&
    settings.divisorStatus === 'CONFIRMED' &&
    rate?.formulaConfirmed === true;

  if (formulaConfirmed) {
    return 'DDP includes delivery to Nigeria with customs/import handling as per supplier arrangement.';
  }
  return 'This is an estimate. Supplier DDP formula is pending confirmation. Final shipping will be confirmed by the ICONJ team.';
}

// ============================================================
// Main calculation function
// ============================================================

export async function calculateDDPShipping(
  product: ProductShippingData,
  quantity: number,
  destination?: string
): Promise<ShippingCalculationResult> {
  const settings = await getShippingSettings();
  const dest = destination ?? settings.defaultDestination;

  // 1. Product has no weight at all
  if (!product.shippingWeightKg) {
    return {
      status: 'MISSING_DATA',
      customerShippingPrice: 0,
      currency: 'NGN',
      label: 'Shipping: Data Required',
      note: 'Shipping data is missing for this product. Please contact ICONJ.',
    };
  }

  // 2. Custom-size product with no reliable dimensions
  if (product.shippingDataStatus === 'CUSTOM_REQUIRED' || product.isConfigurable) {
    return {
      status: 'CUSTOM_REQUIRED',
      customerShippingPrice: 0,
      currency: 'NGN',
      label: 'Shipping Confirmation Required',
      note: 'Custom-size shipping must be confirmed before payment. Please request a quote.',
    };
  }

  // 3. Fetch active rates
  const rates = await getActiveDDPRates(dest);
  if (rates.length === 0) {
    return {
      status: 'MISSING_DATA',
      customerShippingPrice: 0,
      currency: 'NGN',
      label: 'Shipping: Not Configured',
      note: 'DDP rates have not been configured yet. Please contact ICONJ.',
    };
  }

  // 4. Calculate weights
  const actualWeightKg = product.shippingWeightKg;
  let volumetricWeightKg: number | null = null;

  const hasDimensions =
    product.shippingLengthCm && product.shippingWidthCm && product.shippingHeightCm;

  if (hasDimensions && settings.volumetricDivisor) {
    volumetricWeightKg = calculateVolumetricWeight(
      product.shippingLengthCm!,
      product.shippingWidthCm!,
      product.shippingHeightCm!,
      settings.volumetricDivisor
    );
  }

  let chargeableWeightKg = calculateChargeableWeight(
    actualWeightKg,
    volumetricWeightKg,
    settings.chargeableWeightMethod
  );
  chargeableWeightKg = roundChargeableWeight(chargeableWeightKg, settings.roundingMethod);

  const totalChargeableWeightKg = chargeableWeightKg * quantity;

  // 5. Find applicable rate
  const applicableRate = findApplicableRate(totalChargeableWeightKg, rates);
  if (!applicableRate) {
    return {
      status: 'MISSING_DATA',
      customerShippingPrice: 0,
      currency: 'NGN',
      label: 'Shipping: Rate Not Found',
      note: 'No DDP rate bracket covers this weight. Please contact ICONJ.',
    };
  }

  // 6. Calculate financial breakdown
  const supplierDDPCost = applyRate(totalChargeableWeightKg, applicableRate);
  const markupPct = settings.markupPct;
  const markupAmount = supplierDDPCost * (markupPct / 100);
  const customerShippingPrice = Math.ceil(supplierDDPCost + markupAmount); // always round up

  // 7. Determine status
  const divisorConfirmed = settings.divisorStatus === 'CONFIRMED';
  const formulaConfirmed =
    settings.formulaStatus === 'CONFIRMED' &&
    divisorConfirmed &&
    applicableRate.formulaConfirmed;

  const status: ShippingCalculationStatus = formulaConfirmed
    ? 'FORMULA_CONFIRMED'
    : 'ESTIMATED';

  const partialStatus: ShippingCalculationStatus = !hasDimensions ? 'PARTIAL_DATA' : status;

  return {
    status: partialStatus,
    customerShippingPrice,
    currency: applicableRate.currency,
    label: buildLabel(settings, applicableRate),
    note: buildNote(settings, applicableRate),
    _internal: {
      actualWeightKg,
      volumetricWeightKg,
      chargeableWeightKg,
      totalChargeableWeightKg,
      volumetricDivisorUsed: settings.volumetricDivisor,
      divisorConfirmed,
      formulaConfirmed,
      supplierDDPCost,
      markupPct,
      markupAmount,
      rateId: applicableRate.id,
      rateSnapshot: applicableRate,
    },
  };
}

// ============================================================
// Cart-level calculation
// ============================================================

const BLOCKS_CHECKOUT: ShippingCalculationStatus[] = ['CUSTOM_REQUIRED', 'MISSING_DATA', 'NO_RATES'];

export async function calculateDDPShippingForCart(
  items: CartItemForShipping[]
): Promise<CartShippingResult> {
  if (!items.length) {
    return {
      worstStatus: 'MISSING_DATA',
      totalCustomerShipping: 0,
      currency: 'NGN',
      items: [],
      blocksCheckout: false,
    };
  }

  const supabase = getAdminClient();
  const productIds = [...new Set(items.map(i => i.productId))];

  const { data: products } = await supabase
    .from('products')
    .select('id, shipping_weight_kg, shipping_length_cm, shipping_width_cm, shipping_height_cm, shipping_data_status, is_configurable')
    .in('id', productIds);

  const productMap: Record<string, any> = {};
  for (const p of products || []) productMap[p.id] = p;

  const results: Array<{ productId: string; result: ShippingCalculationResult }> = [];
  let totalCustomerShipping = 0;
  let worstStatus: ShippingCalculationStatus = 'FORMULA_CONFIRMED';

  const statusOrder: ShippingCalculationStatus[] = [
    'FORMULA_CONFIRMED', 'ESTIMATED', 'PARTIAL_DATA',
    'CUSTOM_REQUIRED', 'NO_RATES', 'MISSING_DATA',
  ];

  for (const item of items) {
    const p = productMap[item.productId];
    if (!p) {
      results.push({ productId: item.productId, result: {
        status: 'MISSING_DATA', customerShippingPrice: 0, currency: 'NGN',
        label: 'Shipping: Product Not Found', note: 'Product not found.'
      }});
      worstStatus = 'MISSING_DATA';
      continue;
    }

    const productData: ProductShippingData = {
      id: p.id,
      shippingWeightKg: item.customWeightKg ?? p.shipping_weight_kg,
      shippingLengthCm: item.customLengthCm ?? p.shipping_length_cm,
      shippingWidthCm: item.customWidthCm ?? p.shipping_width_cm,
      shippingHeightCm: item.customHeightCm ?? p.shipping_height_cm,
      shippingDataStatus: p.shipping_data_status,
      isConfigurable: item.isCustomSize || p.is_configurable,
    };

    const result = await calculateDDPShipping(productData, item.quantity);
    results.push({ productId: item.productId, result });
    totalCustomerShipping += result.customerShippingPrice;

    // Track worst status
    const currentIdx = statusOrder.indexOf(worstStatus);
    const newIdx = statusOrder.indexOf(result.status);
    if (newIdx > currentIdx) worstStatus = result.status;
  }

  const blocksCheckout = BLOCKS_CHECKOUT.includes(worstStatus);
  let blocksCheckoutReason: string | undefined;

  if (worstStatus === 'CUSTOM_REQUIRED') {
    blocksCheckoutReason = 'One or more items require a custom shipping confirmation before payment. Please request a quote.';
  } else if (worstStatus === 'MISSING_DATA') {
    blocksCheckoutReason = 'Shipping data is incomplete for one or more items. Please contact ICONJ.';
  } else if (worstStatus === 'NO_RATES') {
    blocksCheckoutReason = 'DDP shipping rates have not been configured. Please contact ICONJ.';
  }

  return {
    worstStatus,
    totalCustomerShipping,
    currency: 'NGN',
    items: results,
    blocksCheckout,
    blocksCheckoutReason,
  };
}

// ============================================================
// Snapshot (write immutable order shipping record)
// ============================================================

export async function snapshotShippingForOrder(
  orderId: string,
  cartResult: CartShippingResult
): Promise<void> {
  const supabase = getAdminClient();

  // Aggregate internal data across items
  let totalActual = 0;
  let totalVolumetric = 0;
  let totalChargeable = 0;
  let supplierDDPCost = 0;
  let markupAmount = 0;
  let rateSnapshot: any = null;
  let rateId: string | null = null;
  let formulaConfirmed = false;
  let markupPct = 0;

  for (const { result } of cartResult.items) {
    if (result._internal) {
      totalActual += result._internal.actualWeightKg ?? 0;
      totalVolumetric += result._internal.volumetricWeightKg ?? 0;
      totalChargeable += result._internal.totalChargeableWeightKg ?? 0;
      supplierDDPCost += result._internal.supplierDDPCost;
      markupAmount += result._internal.markupAmount;
      markupPct = result._internal.markupPct; // same for all items
      formulaConfirmed = result._internal.formulaConfirmed;
      if (!rateId && result._internal.rateId) {
        rateId = result._internal.rateId;
        rateSnapshot = result._internal.rateSnapshot;
      }
    }
  }

  const shippingStatus =
    cartResult.worstStatus === 'FORMULA_CONFIRMED' ? 'FORMULA_CONFIRMED' :
    cartResult.worstStatus === 'CUSTOM_REQUIRED'   ? 'CUSTOM_REQUIRED'   :
    'ESTIMATED';

  const { data: calc } = await supabase
    .from('shipping_calculations')
    .insert({
      order_id: orderId,
      quantity: cartResult.items.reduce((sum, i) => sum + 1, 0),
      total_chargeable_weight_kg: totalChargeable,
      total_actual_weight_kg: totalActual,
      total_volumetric_weight_kg: totalVolumetric,
      ddp_rate_id: rateId,
      rate_snapshot: rateSnapshot,
      supplier_ddp_cost: supplierDDPCost,
      markup_pct: markupPct,
      markup_amount: markupAmount,
      customer_shipping_price: cartResult.totalCustomerShipping,
      calculation_status: shippingStatus === 'FORMULA_CONFIRMED' ? 'FORMULA_CONFIRMED' : 'ESTIMATED',
      formula_confirmed: formulaConfirmed,
    })
    .select('id')
    .single();

  await supabase.from('order_shipping_snapshots').upsert({
    order_id: orderId,
    shipping_calculation_id: calc?.id ?? null,
    total_actual_weight_kg: totalActual,
    total_volumetric_weight_kg: totalVolumetric,
    total_chargeable_weight_kg: totalChargeable,
    ddp_rate_id: rateId,
    rate_snapshot: rateSnapshot ?? {},
    supplier_ddp_cost: supplierDDPCost,
    markup_pct: markupPct,
    markup_amount: markupAmount,
    customer_shipping_price: cartResult.totalCustomerShipping,
    formula_confirmed_at_time: formulaConfirmed,
    shipping_status: shippingStatus,
  }, { onConflict: 'order_id', ignoreDuplicates: false });
}
