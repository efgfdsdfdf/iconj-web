import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth/admin';
import { convertQuotationToOrder } from '@/lib/quotation-helpers';

// POST /api/admin/quotations/[id]/convert-to-order
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminError = await verifyAdmin();
  if (adminError) return adminError;

  const { id } = await params;

  try {
    const result = await convertQuotationToOrder(id);
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Manual conversion failed:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
