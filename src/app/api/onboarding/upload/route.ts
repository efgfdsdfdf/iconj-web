import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const supabaseUser = await createServerClient();
    const { data: { user } } = await supabaseUser.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}_${Math.random().toString(36).substring(2, 10)}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Using seller-documents bucket for privacy (assuming it exists or fallback to product-images if not)
    // Actually, let's stick to issue-evidence or a new seller-documents bucket.
    // To be safe, we'll use "product-images" bucket for now if seller-documents isn't created, but ideally "seller-documents"
    let bucket = "product-images"; // fallback
    
    // Check if seller-documents exists, if not we'll just use product-images
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    if (buckets?.some(b => b.name === "seller-documents")) {
      bucket = "seller-documents";
    }

    const { error: uploadError } = await supabaseAdmin.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return NextResponse.json({ url: publicUrl });
  } catch (error: any) {
    console.error("Onboarding upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
