import { NextResponse } from 'next/server';
import { releasePendingFunds } from '@/lib/wallet';

async function handleReleaseFunds(request: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const released = await releasePendingFunds();

    return NextResponse.json({
      success: true,
      released
    });
  } catch (error: any) {
    console.error('Error releasing pending funds:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return handleReleaseFunds(request);
}

export async function POST(request: Request) {
  return handleReleaseFunds(request);
}
