import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    const { data, error } = await supabaseAdmin.from('supplier_deposits').select('*').order('created_at', { ascending: false });
    if (error) throw error;

    // Calculate current balance
    const balance = data.length > 0 ? data[0].balance_after : 0;

    return NextResponse.json({ success: true, balance, transactions: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { transaction_type, amount, reference, notes } = await request.json();

    if (!transaction_type || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get current balance
    const { data: latest } = await supabaseAdmin.from('supplier_deposits').select('balance_after').order('created_at', { ascending: false }).limit(1);
    
    let current_balance = (latest && latest.length > 0) ? Number(latest[0].balance_after) : 0;
    let new_balance = current_balance;

    if (transaction_type === 'CREDIT' || transaction_type === 'REFUND') {
      new_balance += Number(amount);
    } else if (transaction_type === 'DEBIT') {
      new_balance -= Number(amount);
    }

    const { data, error } = await supabaseAdmin.from('supplier_deposits').insert([{
      transaction_type,
      amount: Number(amount),
      balance_after: new_balance,
      reference: reference || null,
      notes: notes || null
    }]).select().single();

    if (error) throw error;
    return NextResponse.json({ success: true, transaction: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
