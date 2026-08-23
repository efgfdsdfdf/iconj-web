import { NextResponse } from 'next/server';
import { suggestCategory, parseRawText } from '@/lib/alibaba-parser';

export async function POST(request: Request) {
  try {
    const { url, testMode, rawText } = await request.json();

    if (!url && !rawText) {
      return NextResponse.json({ error: 'URL or Page Text is required' }, { status: 400 });
    }

    // ----------------------------------------------------
    // TEST MODE (Does not use API Quota)
    // ----------------------------------------------------
    if (testMode) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      return NextResponse.json({
        success: true,
        data: {
          name: "Test Product: Premium Silicone Baby Feeding Set (Test Mode)",
          description: "This is a simulated product import to test the system without using your ScraperAPI requests. Turn off Test Mode to import real products.",
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
    // LIVE MODE (Uses ScraperAPI)
    // ----------------------------------------------------
    const SCRAPER_API_KEY = '63d43462abd76bdd1664c3f9c87100df';
    // premium=true guarantees bypass of Alibaba firewall
    const proxyUrl = `http://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(url)}&premium=true`;
    
    let html = "";
    try {
      const response = await fetch(proxyUrl, { method: 'GET' });
      if (!response.ok) {
        throw new Error("ScraperAPI returned " + response.status);
      }
      html = await response.text();
    } catch (e: any) {
      console.error("ScraperAPI Error:", e);
      return NextResponse.json({ error: "Failed to connect to ScraperAPI. " + e.message }, { status: 500 });
    }

    // ----------------------------------------------------
    // PARSE HTML RESPONSE
    // ----------------------------------------------------
    
    // 1. Extract Title
    const titleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i) || html.match(/<title>([^<]+)<\/title>/i);
    let name = titleMatch ? titleMatch[1].replace("- Buy  Product on Alibaba.com", "").trim() : "Alibaba Product";
    if (name.length > 200) name = name.substring(0, 200);
    
    // 2. Extract Images (s.alicdn.com)
    const imgRegex = /(https:\/\/s\.alicdn\.com\/@sc04\/kf\/[^"'\s\\]+\.(?:jpg|png|jpeg))/gi;
    const allImgs = Array.from(html.matchAll(imgRegex)).map((m: any) => m[1]);
    let images = [...new Set(allImgs)]
      .filter((img: any) => typeof img === 'string' && !img.includes('100x100') && !img.includes('300x300')) 
      .map((img: any) => img.split('_')[0]) 
      .slice(0, 10); 

    // 3. Extract Price
    let supplier_price = 0;
    const priceRegex = /"price":"?([0-9.]+)"?/i;
    const priceMatch = html.match(priceRegex);
    if (priceMatch) {
       supplier_price = parseFloat(priceMatch[1]) * 1500; // rough USD to NGN
    }

    // 4. Try full text parser as a backup to catch variants and supplier names
    let parsedVariants: any[] = [];
    let parsedSupplier = "Alibaba Supplier";
    
    try {
      const strippedText = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
                               .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
                               .replace(/<[^>]+>/g, ' ')
                               .replace(/\s+/g, ' ');
      
      const parsedData = parseRawText(strippedText, url);
      
      if (parsedData.variants && parsedData.variants.length > 0) {
        parsedVariants = parsedData.variants;
      }
      if (parsedData.supplier_name) {
        parsedSupplier = parsedData.supplier_name;
      }
      if (supplier_price === 0 && parsedData.supplier_price) {
        supplier_price = parsedData.supplier_price;
      }
    } catch(e) {
      console.error("Text parsing failed, using regex fallbacks", e);
    }

    return NextResponse.json({
      success: true,
      data: {
        name,
        description: `Imported seamlessly via ScraperAPI.\nOriginal URL: ${url}`,
        supplier_price: supplier_price || 0,
        moq: 1,
        supplier_name: parsedSupplier,
        supplier_sku: "", 
        images: images,
        variants: parsedVariants,
        category_suggestion: suggestCategory(name),
        supplier_product_url: url
      }
    });
    
  } catch (error: any) {
    console.error('ScraperAPI Route Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to import product' }, { status: 500 });
  }
}