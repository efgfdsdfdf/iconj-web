import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// GET /api/marketing/unsubscribe?token=...
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return new NextResponse('Invalid token', { status: 400 });
  }

  // Idempotent update
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ marketing_opt_in: false })
    .eq('marketing_unsubscribe_token', token);

  if (error) {
    console.error('Unsubscribe error:', error);
    return new NextResponse('Failed to process unsubscribe request', { status: 500 });
  }

  // Simple HTML response
  return new NextResponse(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Unsubscribed</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: system-ui, sans-serif; text-align: center; padding: 40px 20px; background: #f8fafc; color: #0f172a; }
        .box { background: white; max-width: 400px; margin: 0 auto; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
        h1 { color: #15803d; font-size: 24px; margin-top: 0; }
        a { color: #2563eb; text-decoration: none; font-weight: 600; }
      </style>
    </head>
    <body>
      <div class="box">
        <h1>Successfully Unsubscribed</h1>
        <p>You have been removed from our marketing emails.</p>
        <p>You will continue to receive important transactional emails regarding your orders and quotations.</p>
        <p style="margin-top: 24px;"><a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://iconj.com.ng'}">Return to ICONJ</a></p>
      </div>
    </body>
    </html>
  `, { headers: { 'Content-Type': 'text/html' } });
}
