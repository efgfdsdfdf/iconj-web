import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const url = 'https://www.alibaba.com/product-detail/Baby-Carrier-With-Hip-Seat-Lumbar_1601075905169.html';
  try {
    const res = await fetch('https://api.allorigins.win/get?url=' + encodeURIComponent(url));
    const data = await res.json();
    const html = data.contents;
    
    // Check if it looks like Alibaba or a bot challenge
    const hasTitle = html.includes('<title>');
    const hasImages = html.includes('s.alicdn.com');
    const isBot = html.includes('captcha') || html.includes('Security');
    
    return NextResponse.json({ length: html?.length, hasTitle, hasImages, isBot });
  } catch (e: any) {
    return NextResponse.json({ error: e.message });
  }
}