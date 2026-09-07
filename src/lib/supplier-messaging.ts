/**
 * ICONJ Supplier Messaging Service
 *
 * DESIGN NOTE: This is intentionally a standalone, stateless service.
 * All supplier message generation is centralised here.
 * A future direct supplier API integration only needs to add
 * sendSupplierRequestViaAPI() and sendSupplierFulfillmentViaAPI()
 * without touching any quotation or order logic.
 */

// ─── Types ─────────────────────────────────────────────────────────────────

export interface SupplierRequestPayload {
  quotationReference: string;
  productName: string;
  supplierProductUrl?: string | null;
  quantity: number;
  specifications: Record<string, any>;
  deliveryLocation: Record<string, any>;
  customerNotes?: string | null;
}

export interface SupplierFulfillmentPayload {
  orderReference: string;
  quotationReference: string;
  productName: string;
  supplierProductUrl?: string | null;
  quantity: number;
  specifications: Record<string, any>;
  deliveryLocation: Record<string, any>;
  agreedSpecs?: Record<string, any> | null;
  customerNotes?: string | null;
}

// ─── Message Generators ─────────────────────────────────────────────────────

/**
 * Builds the copy-paste supplier quotation request message.
 * Auto-populates all customer specs so admin never rewrites them.
 */
export function buildSupplierRequestMessage(payload: SupplierRequestPayload): string {
  const specs = payload.specifications || {};
  const delivery = payload.deliveryLocation || {};

  const lines: string[] = [];
  lines.push(`Hello,`);
  lines.push(``);
  lines.push(`I would like to request a quotation for the following order.`);
  lines.push(``);
  lines.push(`--- ORDER DETAILS ---`);
  lines.push(``);
  lines.push(`Reference: ${payload.quotationReference}`);
  lines.push(`Product: ${payload.productName}`);
  if (payload.supplierProductUrl) {
    lines.push(`Product URL: ${payload.supplierProductUrl}`);
  }
  lines.push(`Quantity: ${payload.quantity}`);
  lines.push(``);
  lines.push(`--- SPECIFICATIONS ---`);
  lines.push(``);

  if (specs.width) lines.push(`Width: ${specs.width} cm`);
  if (specs.height) lines.push(`Height: ${specs.height} cm`);
  if (specs.colour) lines.push(`Colour: ${specs.colour}`);
  if (specs.design) lines.push(`Design: ${specs.design}`);
  if (specs.fabric) lines.push(`Fabric: ${specs.fabric}`);
  if (specs.blindType) lines.push(`Blind Type: ${specs.blindType}`);
  if (specs.motorized !== undefined) lines.push(`Motorized: ${specs.motorized ? 'Yes' : 'No'}`);
  if (specs.logo) lines.push(`Logo Requirements: ${specs.logo}`);
  if (specs.customization) lines.push(`Additional Customization: ${specs.customization}`);

  // Any other spec fields not explicitly listed above
  const knownKeys = ['width','height','colour','color','design','fabric','blindType','motorized','logo','customization'];
  for (const [key, value] of Object.entries(specs)) {
    if (!knownKeys.includes(key) && value !== undefined && value !== null && value !== '') {
      const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      lines.push(`${label}: ${value}`);
    }
  }

  if (payload.customerNotes) {
    lines.push(``);
    lines.push(`Special Instructions: ${payload.customerNotes}`);
  }

  lines.push(``);
  lines.push(`--- DELIVERY DESTINATION ---`);
  lines.push(``);
  if (delivery.address) lines.push(`Address: ${delivery.address}`);
  if (delivery.city) lines.push(`City: ${delivery.city}`);
  if (delivery.state) lines.push(`State: ${delivery.state}`);
  if (delivery.country) lines.push(`Country: ${delivery.country || 'Nigeria'}`);

  lines.push(``);
  lines.push(`--- PLEASE PROVIDE ---`);
  lines.push(``);
  lines.push(`1. Product price for the requested quantity`);
  lines.push(`2. Customization/logo cost (if applicable)`);
  lines.push(`3. Shipping cost to the above destination`);
  lines.push(`4. Production time`);
  lines.push(`5. Estimated delivery time`);
  lines.push(`6. Shipping method`);
  lines.push(`7. MOQ (if applicable)`);
  lines.push(`8. Any additional charges`);
  lines.push(`9. Total cost`);
  lines.push(`10. Confirmation that all requested specifications can be fulfilled`);
  lines.push(``);
  lines.push(`If there are any issues with the specifications, please advise before proceeding.`);
  lines.push(``);
  lines.push(`Thank you.`);

  return lines.join('\n');
}

/**
 * Builds the copy-paste supplier fulfillment order message.
 * Used after customer has paid and order has been created.
 */
export function buildSupplierFulfillmentMessage(payload: SupplierFulfillmentPayload): string {
  const specs = payload.agreedSpecs || payload.specifications || {};
  const delivery = payload.deliveryLocation || {};

  const lines: string[] = [];
  lines.push(`Hello,`);
  lines.push(``);
  lines.push(`Please proceed with the following confirmed order.`);
  lines.push(``);
  lines.push(`--- CONFIRMED ORDER ---`);
  lines.push(``);
  lines.push(`Order Reference: ${payload.orderReference}`);
  lines.push(`Quotation Reference: ${payload.quotationReference}`);
  lines.push(`Product: ${payload.productName}`);
  if (payload.supplierProductUrl) {
    lines.push(`Product URL: ${payload.supplierProductUrl}`);
  }
  lines.push(`Quantity: ${payload.quantity}`);
  lines.push(``);
  lines.push(`--- CONFIRMED SPECIFICATIONS ---`);
  lines.push(``);

  if (specs.width) lines.push(`Width: ${specs.width} cm`);
  if (specs.height) lines.push(`Height: ${specs.height} cm`);
  if (specs.colour || specs.color) lines.push(`Colour: ${specs.colour || specs.color}`);
  if (specs.design) lines.push(`Design: ${specs.design}`);
  if (specs.fabric) lines.push(`Fabric: ${specs.fabric}`);
  if (specs.blindType) lines.push(`Blind Type: ${specs.blindType}`);
  if (specs.motorized !== undefined) lines.push(`Motorized: ${specs.motorized ? 'Yes' : 'No'}`);
  if (specs.logo) lines.push(`Logo Requirements: ${specs.logo}`);
  if (specs.customization) lines.push(`Additional Customization: ${specs.customization}`);

  const knownKeys = ['width','height','colour','color','design','fabric','blindType','motorized','logo','customization'];
  for (const [key, value] of Object.entries(specs)) {
    if (!knownKeys.includes(key) && value !== undefined && value !== null && value !== '') {
      const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      lines.push(`${label}: ${value}`);
    }
  }

  if (payload.customerNotes) {
    lines.push(``);
    lines.push(`Special Instructions: ${payload.customerNotes}`);
  }

  lines.push(``);
  lines.push(`--- DELIVERY DESTINATION ---`);
  lines.push(``);
  if (delivery.address) lines.push(`Address: ${delivery.address}`);
  if (delivery.city) lines.push(`City: ${delivery.city}`);
  if (delivery.state) lines.push(`State: ${delivery.state}`);
  if (delivery.country) lines.push(`Country: ${delivery.country || 'Nigeria'}`);

  lines.push(``);
  lines.push(`Please confirm receipt and provide:`);
  lines.push(`1. Confirmation that all specifications can be fulfilled as stated`);
  lines.push(`2. Production start date`);
  lines.push(`3. Estimated completion date`);
  lines.push(`4. Shipping tracking information once dispatched`);
  lines.push(``);
  lines.push(`Thank you.`);

  return lines.join('\n');
}

// ─── Future Integration Point ────────────────────────────────────────────────
// When a direct supplier API becomes available, add the integration here.
// Nothing in the quotation or order system needs to change.

// export async function sendSupplierRequestViaAPI(
//   payload: SupplierRequestPayload,
//   supplierApiConfig: SupplierApiConfig
// ): Promise<{ success: boolean; supplierReference?: string }> {
//   // Direct API integration goes here
// }

// export async function sendSupplierFulfillmentViaAPI(
//   payload: SupplierFulfillmentPayload,
//   supplierApiConfig: SupplierApiConfig
// ): Promise<{ success: boolean; supplierReference?: string }> {
//   // Direct API integration goes here
// }
