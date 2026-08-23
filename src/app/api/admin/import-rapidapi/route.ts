import { NextResponse } from 'next/server';
import { suggestCategory } from '@/lib/alibaba-parser';

export async function POST(request: Request) {
  try {
    const { url, testMode } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // ----------------------------------------------------
    // TEST MODE (Does not use RapidAPI Quota)
    // ----------------------------------------------------
    if (testMode) {
      // Simulate API delay
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
    // LIVE MODE (Uses RapidAPI)
    // ----------------------------------------------------
    const apiKey = 'fe92b9bf9bmsh77dacb45b60bfdbp16265ajsn4667758d25b3';
    
    // Most rapid APIs expect the url parameter as a query string
    const apiUrl = `https://alibaba3.p.rapidapi.com/getProductByURL?url=${encodeURIComponent(url)}`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-rapidapi-host': 'alibaba3.p.rapidapi.com',
        'x-rapidapi-key': apiKey
      }
    });

    if (!response.ok) {
      throw new Error("API returned " + response.status);
    }

    const rawData = await response.json();
    
    // The API might nest data under 'data', 'result', 'item', etc.
    const item = rawData.data || rawData.result || rawData.item || rawData;

    // Defensively map the response to our ParsedProduct format
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
      images: images.slice(0, 10), // Limit to 10 images max
      variants: variants,
      category_suggestion: suggestCategory(name),
      supplier_product_url: url
    };

    return NextResponse.json({ success: true, data: parsedData });
    
  } catch (error: any) {
    console.error('RapidAPI Import Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to import product' }, { status: 500 });
  }
}