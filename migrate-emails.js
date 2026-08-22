const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function migrate() {
  const sql = `
    CREATE TABLE IF NOT EXISTS order_emails (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      email_type TEXT NOT NULL,
      recipient_email TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SENT', 'FAILED')),
      error_message TEXT,
      sent_at TIMESTAMPTZ DEFAULT NOW(),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(order_id, email_type)
    );
  `;

  const { error } = await supabase.rpc('exec_sql', { query: sql });
  if (error) {
    console.log('RPC failed, trying raw SQL via REST...');
    // Try direct SQL via the management API
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/`,
      {
        method: 'POST',
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('Fallback response:', response.status);
    console.log('Please run the SQL manually in the Supabase SQL editor:');
    console.log(sql);
  } else {
    console.log('Migration successful!');
  }

  // Try creating index separately
  const indexSql = `CREATE INDEX IF NOT EXISTS idx_order_emails_order_id ON order_emails(order_id);`;
  const { error: idxErr } = await supabase.rpc('exec_sql', { query: indexSql });
  if (idxErr) {
    console.log('Index creation via RPC failed. Run manually:', indexSql);
  }
}

migrate().catch(console.error);
