import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { slug, title, headline, subheadline, hero_image_url, body_content, theme_color, product_id } = body;

    if (!slug || !title || !headline) {
      return NextResponse.json({ error: 'slug, title, and headline are required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('landing_pages')
      .insert([{
        slug,
        title,
        headline,
        subheadline: subheadline || null,
        hero_image_url: hero_image_url || null,
        body_content: body_content || null,
        theme_color: theme_color || '#f97316',
        product_id: product_id || null,
        is_active: true,
      }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'A landing page with this slug already exists. Choose a different URL slug.' }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ success: true, page: data });
  } catch (err: any) {
    console.error('Landing page create error:', err);
    return NextResponse.json({ error: err.message || 'Failed to create landing page' }, { status: 500 });
  }
}

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('landing_pages')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ pages: data });
}
