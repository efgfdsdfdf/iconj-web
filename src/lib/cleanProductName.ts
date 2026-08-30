/**
 * cleanProductName — display-only utility.
 * Converts raw supplier names to clean, customer-friendly display titles.
 * The original product.name is NEVER modified in the database.
 */

type Rule = { keywords: RegExp; display: string };
type Qualifier = { keywords: RegExp; prefix: string };
type Color = { keywords: RegExp; color: string };

const PRODUCT_TYPE_RULES: Rule[] = [
  { keywords: /zebra|day.?night|banded shade|dual layer/i, display: "Zebra Blind" },
  { keywords: /roller|roll.?up/i, display: "Roller Blind" },
  { keywords: /roman blind/i, display: "Roman Blind" },
  { keywords: /venetian|wooden blind|aluminium blind/i, display: "Venetian Blind" },
  { keywords: /vertical blind/i, display: "Vertical Blind" },
  { keywords: /blackout curtain|blackout drape|room darkening curtain/i, display: "Blackout Curtain" },
  { keywords: /blackout blind|blackout shade/i, display: "Blackout Roller Blind" },
  { keywords: /sheer curtain|voile/i, display: "Sheer Curtain" },
  { keywords: /curtain|drape|drapery/i, display: "Curtain" },
  { keywords: /blind|shade/i, display: "Window Blind" },
  { keywords: /curtain rod|curtain track|curtain rail/i, display: "Curtain Rod" },
];

const QUALIFIERS: Qualifier[] = [
  { keywords: /outdoor|exterior|balcony|patio|porch|carport|deck/i, prefix: "Outdoor" },
  { keywords: /blackout|blockout|room.?darkening/i, prefix: "Blackout" },
  { keywords: /motorized|motorised|electric|automated/i, prefix: "Motorized" },
  { keywords: /thermal|insulating/i, prefix: "Thermal" },
  { keywords: /waterproof|water.?resistant/i, prefix: "Waterproof" },
];

const COLORS: Color[] = [
  { keywords: /\bwhite\b/i, color: "White" },
  { keywords: /\bblack\b/i, color: "Black" },
  { keywords: /\bgrey\b|\bgray\b/i, color: "Grey" },
  { keywords: /\bbeige\b|\bcream\b/i, color: "Beige" },
  { keywords: /\bbrown\b|\bwood\b/i, color: "Brown" },
  { keywords: /\bnavy\b/i, color: "Navy" },
  { keywords: /\bgreen\b/i, color: "Green" },
];

const SUPPLIER_JARGON = /(\d+\s*[*x]\s*\d+|per\s+sq|customized\s+size|W\d+\*H\d+|MOQ|sq\.m|pcs\s*\/)/i;

export function cleanProductName(rawName: string): string {
  if (!rawName?.trim()) return "Window Treatment";

  // Already short and clean — use as-is
  if (rawName.trim().length <= 50 && !SUPPLIER_JARGON.test(rawName)) {
    return rawName.trim();
  }

  let productType = "Window Treatment";
  for (const rule of PRODUCT_TYPE_RULES) {
    if (rule.keywords.test(rawName)) { productType = rule.display; break; }
  }

  const qualifierParts: string[] = [];
  for (const q of QUALIFIERS) {
    if (q.keywords.test(rawName)) {
      if (q.prefix === "Blackout" && productType.toLowerCase().includes("blackout")) continue;
      qualifierParts.push(q.prefix);
      break;
    }
  }

  let colorPart = "";
  for (const c of COLORS) {
    if (c.keywords.test(rawName)) { colorPart = c.color; break; }
  }

  const parts: string[] = ["Premium", ...qualifierParts];
  if (colorPart) parts.push(colorPart);
  parts.push(productType);

  return parts.join(" ");
}
