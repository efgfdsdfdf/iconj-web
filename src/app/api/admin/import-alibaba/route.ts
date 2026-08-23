import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/admin/import-alibaba
 * 
 * Accepts image URLs from Alibaba and downloads them to Supabase Storage.
 * This ensures images are permanently stored and not dependent on Alibaba hotlinks.
 */
export async function POST(request: Request) {
  try {
    const { imageUrls } = await request.json();

    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return NextResponse.json({ error: "No image URLs provided" }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const uploadedUrls: string[] = [];

    for (const url of imageUrls.slice(0, 15)) { // limit to 15 images
      try {
        // Download image from Alibaba
        const response = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Referer": "https://www.alibaba.com/",
          },
        });

        if (!response.ok) {
          console.warn(`Failed to download image: ${url} - ${response.status}`);
          continue;
        }

        const contentType = response.headers.get("content-type") || "image/jpeg";
        const buffer = Buffer.from(await response.arrayBuffer());

        // Generate unique filename
        const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
        const fileName = `alibaba-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

        const { error } = await supabaseAdmin.storage
          .from("product-images")
          .upload(fileName, buffer, { contentType });

        if (error) {
          console.warn(`Failed to upload image to Supabase: ${error.message}`);
          continue;
        }

        const { data } = supabaseAdmin.storage.from("product-images").getPublicUrl(fileName);
        uploadedUrls.push(data.publicUrl);
      } catch (err) {
        console.warn(`Error processing image ${url}:`, err);
        continue;
      }
    }

    return NextResponse.json({ success: true, urls: uploadedUrls });
  } catch (error: any) {
    console.error("Import Alibaba image error:", error);
    return NextResponse.json({ error: error.message || "Server Error" }, { status: 500 });
  }
}
