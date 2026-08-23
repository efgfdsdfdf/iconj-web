import { NextResponse } from 'next/server';
import { suggestCategory, parseRawText } from '@/lib/alibaba-parser';

export async function POST(request: Request) {
  try {
    const { url, testMode, rawText } = await request.json();

    if (!url && !rawText) {
      return NextResponse.json({ error: 'URL or Page Text is required' }, { status: 400 });
    }

    // ----------------------------------------------------
    // TEST MODE (Does not use RapidAPI Quota)
    // ----------------------------------------------------
    if (testMode) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      return NextResponse.json({
        success: true,
        data: {
          name: "Test Product: Premium Silicone Baby Feeding Set (Test Mode)",
          description: "This is a simulated product import to test the system without using your 30 free monthly RapidAPI requests. Turn off Test Mode to import real products.",
          supplier_price: 4500,
          moq: 50,
          supplier_name: "Guangzhou Baby Products Co., Ltd",
          supplier_sku: "MOCK-BB-001",
          images: [
            "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=500&q=80",
            "https://images.unsplash.com/photo-1544640808-32cb4fbaee4d?w=500&q=80"
          ],
          variants: [
            { name: "Blue / Standard", color: "Blue", size: "Standard", supplier_sku: "MOCK-BB-BLUE" },
            { name: "Pink / Standard", color: "Pink", size: "Standard", supplier_sku: "MOCK-BB-PINK" }
          ],
          category_suggestion: "Baby Feeding & Nursing",
          supplier_product_url: url
        }
      });
    }

    // ----------------------------------------------------
    // FALLBACK: Raw Text Parsing
    // ----------------------------------------------------
    if (rawText) {
      const result = parseRawText(rawText, url || "");
      return NextResponse.json({
        success: true,
        data: {
          name: result.name || "",
          description: `Imported from Alibaba.\nSupplier: ${result.supplier_name || 'Unknown'}\n\nFeatures:\n${(result.variants || []).map(v => `- ${v.name}`).join('\n')}`,
          supplier_price: result.supplier_price || 0,
          moq: result.moq || 1,
          supplier_name: result.supplier_name || "",
          supplier_sku: result.supplier_sku || "",
          images: result.images || [],
          variants: result.variants || [],
          category_suggestion: result.category_suggestion || "",
          supplier_product_url: url
        }
      });
    }

    // ----------------------------------------------------
    // LIVE MODE (Uses RapidAPI)
    // ----------------------------------------------------
    const apiKey = 'fe92b9bf9bmsh77dacb45b60bfdbp16265ajsn4667758d25b3';
    const apiUrl = `https://alibaba3.p.rapidapi.com/getProductByURL?url=${encodeURIComponent(url)}`;
    
    let response;
    let rapidApiFailed = false;

    try {
      response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-rapidapi-host': 'alibaba3.p.rapidapi.com',
          'x-rapidapi-key': apiKey
        }
      });
      if (!response.ok) {
        rapidApiFailed = true;
      }
    } catch (e: any) {
      rapidApiFailed = true;
    }

    // If RapidAPI succeeds, use its data
    if (!rapidApiFailed && response) {
      const rawData = await response.json();
      const item = rawData.data || rawData.result || rawData.item || rawData;

      const name = item.title || item.name || item.subject || "Imported Product";
      const price = item.price || item.minPrice || item.salePrice || 0;
      
      let images: string[] = [];
      if (Array.isArray(item.images)) images = item.images;
      else if (Array.isArray(item.pictures)) images = item.pictures;
      else if (item.mainImage) images = [item.mainImage];

      let variants: any[] = [];
      if (Array.isArray(item.variants)) {
         variants = item.variants.map((v: any) => ({
           name: v.name || v.title || "Variant",
           color: v.color || "",
           size: v.size || "",
           supplier_sku: v.sku || v.id || ""
         }));
      } else if (Array.isArray(item.skuList)) {
         variants = item.skuList.map((s: any) => ({
           name: s.names || s.skuName || "Variant",
           supplier_sku: s.skuId || ""
         }));
      }

      const parsedData = {
        name,
        description: item.description || item.detail || "Description imported from Alibaba",
        supplier_price: parseFloat(price) || 0,
        moq: parseInt(item.moq || item.minOrderQuantity || 1),
        supplier_name: item.storeName || item.supplierName || item.companyName || "",
        supplier_sku: item.productId || item.id || "",
        images: images.slice(0, 10),
        variants: variants,
        category_suggestion: suggestCategory(name),
        supplier_product_url: url
      };

      return NextResponse.json({ success: true, data: parsedData });
    }

    // ----------------------------------------------------
    // AUTOMATIC URL FALLBACK (If RapidAPI is down)
    // ----------------------------------------------------
    // The user hates copy/pasting. If the API is down (502), we will fetch the HTML ourselves and parse it!
    console.log("RapidAPI failed, falling back to internal HTML scraper...");
    
    try {
      // Fetch the Alibaba page directly
      const htmlRes = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5'
        }
      });
      
      const html = await htmlRes.text();
      
      // Extract Title
      const titleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i) || html.match(/<title>([^<]+)<\/title>/i);
      let name = titleMatch ? titleMatch[1].replace("- Buy  Product on Alibaba.com", "").trim() : "Alibaba Product";
      if (name.length > 200) name = name.substring(0, 200);
      
      // Extract Images
      const imgRegex = /(https:\/\/s\.alicdn\.com\/@sc04\/kf\/[^"'\s\\]+\.(?:jpg|png|jpeg))/gi;
      const allImgs = Array.from(html.matchAll(imgRegex)).map(m => m[1]);
      let images = [...new Set(allImgs)]
        .filter(img => !img.includes('100x100') && !img.includes('300x300')) // prefer high-res
        .map(img => img.split('_')[0]) // remove size suffixes if possible
        .slice(0, 8); // get top 8 images

      // Extract price approximation
      let supplier_price = 0;
      const priceRegex = /"price":"?([0-9.]+)"?/i;
      const priceMatch = html.match(priceRegex);
      if (priceMatch) {
         supplier_price = parseFloat(priceMatch[1]) * 1500; // rough USD to NGN
      }

      return NextResponse.json({
        success: true,
        data: {
          name,
          description: "Imported directly from Alibaba URL.",
          supplier_price: supplier_price || 0,
          moq: 1,
          supplier_name: "Alibaba Supplier",
          supplier_sku: "",
          images: images,
          variants: [],
          category_suggestion: suggestCategory(name),
          supplier_product_url: url
        }
      });

    } catch (fallbackError) {
       console.error("Internal fallback failed:", fallbackError);
       return NextResponse.json({ 
         error: "RapidAPI is down and internal extraction failed. Please try again later or use the Paste Page Text backup." 
       }, { status: 500 });
    }
    
  } catch (error: any) {
    console.error('RapidAPI Import Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to import product' }, { status: 500 });
  }
}