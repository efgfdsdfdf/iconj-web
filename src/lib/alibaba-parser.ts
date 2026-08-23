// Alibaba Product Parser - shared utility module

/**
 * Alibaba Product Parser
 * 
 * Since Alibaba aggressively blocks automated scraping/bots,
 * this module provides a structured way for admins to import products.
 * 
 * Strategy:
 * 1. Admin pastes Alibaba URL → we store it as the supplier_product_url
 * 2. Admin pastes key product info into a structured form OR pastes raw page text
 * 3. We intelligently parse what we can from pasted text
 * 4. Admin reviews and corrects before publishing
 */

export interface ParsedVariant {
  name: string;        // e.g. "Blue / 240ml"
  color?: string;
  size?: string;
  model?: string;
  supplier_sku?: string;
  price?: number;
  image?: string;
}

export interface ParsedProduct {
  name: string;
  description: string;
  images: string[];
  variants: ParsedVariant[];
  supplier_name: string;
  supplier_sku: string;
  supplier_product_url: string;
  supplier_price: number;
  moq: number;
  category_suggestion: string;
  specifications: Record<string, string>;
  weight?: string;
  dimensions?: string;
}

// Category keyword mapping for auto-suggestion
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "Baby Feeding & Nursing": ["feeding", "bottle", "sippy", "cup", "nipple", "breast", "nursing", "formula", "bib", "spoon", "bowl", "plate", "weaning"],
  "Baby Care & Bath": ["bath", "towel", "soap", "shampoo", "lotion", "diaper", "nappy", "wipe", "cream", "powder", "thermometer", "nail", "brush", "comb"],
  "Baby Clothing & Accessories": ["clothing", "clothes", "romper", "onesie", "bodysuit", "sock", "shoe", "hat", "mittens", "bib", "dress", "pant", "shirt", "jacket"],
  "Nursery & Furniture": ["crib", "cot", "bed", "mattress", "pillow", "blanket", "swaddle", "bassinet", "changing", "table", "dresser", "wardrobe", "shelf", "lamp", "mobile", "curtain"],
  "Baby Travel": ["stroller", "car seat", "carrier", "wrap", "sling", "travel", "bag", "backpack", "wagon"],
  "Toys & Development": ["toy", "rattle", "teether", "puzzle", "block", "book", "play", "mat", "gym", "walker", "bouncer", "swing", "musical"],
  "Maternity & Mother Care": ["maternity", "mother", "mom", "pregnancy", "prenatal", "postnatal", "nursing", "breast pump", "belly", "support"],
  "Gifts & Bundles": ["gift", "bundle", "set", "hamper", "basket", "box"]
};

export function suggestCategory(productName: string): string {
  const lower = productName.toLowerCase();
  let bestMatch = "Baby Care & Bath"; // default
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = category;
    }
  }
  return bestMatch;
}

/**
 * Parse raw text pasted by the admin from an Alibaba product page.
 * This is a best-effort parser that extracts what it can.
 */
export function parseRawText(rawText: string, alibabaUrl: string): Partial<ParsedProduct> {
  const lines = rawText.split("\n").map(l => l.trim()).filter(Boolean);
  
  // Try to extract product name (usually the first substantial line)
  let name = "";
  for (const line of lines) {
    if (line.length > 10 && line.length < 300 && !line.startsWith("http")) {
      name = line;
      break;
    }
  }

  // Try to extract price
  let supplierPrice = 0;
  const pricePatterns = [
    /\$\s*([\d,.]+)/,
    /USD\s*([\d,.]+)/i,
    /([\d,.]+)\s*(?:USD|usd)/,
    /US\s*\$\s*([\d,.]+)/,
  ];
  for (const line of lines) {
    for (const pattern of pricePatterns) {
      const match = line.match(pattern);
      if (match) {
        const val = parseFloat(match[1].replace(",", ""));
        if (val > 0 && val < 100000) {
          supplierPrice = val;
          break;
        }
      }
    }
    if (supplierPrice > 0) break;
  }

  // Try to extract MOQ
  let moq = 1;
  const moqPatterns = [
    /MOQ[:\s]*([\d]+)/i,
    /Min(?:imum)?\s*(?:Order|order)[:\s]*([\d]+)/i,
    /([\d]+)\s*(?:piece|pcs|unit|set)/i,
  ];
  for (const line of lines) {
    for (const pattern of moqPatterns) {
      const match = line.match(pattern);
      if (match) {
        const val = parseInt(match[1]);
        if (val > 0 && val < 100000) {
          moq = val;
          break;
        }
      }
    }
    if (moq > 1) break;
  }

  // Try to extract supplier/store name
  let supplierName = "";
  const supplierPatterns = [
    /(?:Store|Shop|Seller|Supplier|Company)[:\s]*(.+)/i,
    /(.+?)\s*(?:Official Store|Store|Trading|Co\.,?\s*Ltd)/i,
  ];
  for (const line of lines) {
    for (const pattern of supplierPatterns) {
      const match = line.match(pattern);
      if (match && match[1].length > 2 && match[1].length < 100) {
        supplierName = match[1].trim();
        break;
      }
    }
    if (supplierName) break;
  }

  // Try to extract colors/variants
  const variants: ParsedVariant[] = [];
  const colorPatterns = /\b(red|blue|pink|green|white|black|yellow|purple|orange|grey|gray|brown|beige|navy|cream|gold|silver|khaki|rose|coral|teal|mint|lavender|ivory|transparent|clear)\b/gi;
  const foundColors = new Set<string>();
  for (const line of lines) {
    const colorMatches = line.match(colorPatterns);
    if (colorMatches) {
      colorMatches.forEach(c => foundColors.add(c.charAt(0).toUpperCase() + c.slice(1).toLowerCase()));
    }
  }
  
  // Try to extract sizes
  const sizePatterns = /\b(\d+\s*(?:ml|cm|mm|inch|inches|oz|g|kg|L|XL|XXL|S|M|L))\b/gi;
  const foundSizes = new Set<string>();
  for (const line of lines) {
    const sizeMatches = line.match(sizePatterns);
    if (sizeMatches) {
      sizeMatches.forEach(s => foundSizes.add(s));
    }
  }

  // Build variant combinations
  const colors = Array.from(foundColors);
  const sizes = Array.from(foundSizes);
  
  if (colors.length > 0 && sizes.length > 0) {
    for (const color of colors) {
      for (const size of sizes) {
        variants.push({ name: `${color} / ${size}`, color, size });
      }
    }
  } else if (colors.length > 0) {
    for (const color of colors) {
      variants.push({ name: color, color });
    }
  } else if (sizes.length > 0) {
    for (const size of sizes) {
      variants.push({ name: size, size });
    }
  }

  // Extract images (URLs ending in common image extensions)
  const images: string[] = [];
  const imgPattern = /https?:\/\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp|gif)(?:\?[^\s"'<>]*)?/gi;
  for (const line of lines) {
    const imgMatches = line.match(imgPattern);
    if (imgMatches) {
      imgMatches.forEach(url => {
        if (!images.includes(url) && images.length < 20) {
          images.push(url);
        }
      });
    }
  }

  // Description: grab remaining lines as description
  const descLines = lines.filter(l => 
    l !== name && 
    l.length > 20 && 
    !l.startsWith("http") &&
    !l.match(/^\$/) &&
    !l.match(/MOQ/i)
  ).slice(0, 10);

  return {
    name: name || "",
    description: descLines.join("\n"),
    images,
    variants,
    supplier_name: supplierName,
    supplier_sku: "",
    supplier_product_url: alibabaUrl,
    supplier_price: supplierPrice,
    moq,
    category_suggestion: name ? suggestCategory(name) : "Baby Care & Bath",
    specifications: {},
  };
}
