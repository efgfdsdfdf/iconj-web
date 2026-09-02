const fs = require('fs');
const path = require('path');
const dir = path.join(process.cwd(), 'src/app/api/account/orders/exception');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
const file = path.join(dir, 'route.ts');

const content = `import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { issueId, decision } = await req.json();

    const supabaseAdmin = await createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    
    // Fetch the issue and verify ownership
    const { data: issue } = await supabaseAdmin.from("logistics_issues").select("*, orders(user_id)").eq("id", issueId).single();
    if (!issue || issue.orders.user_id !== user.id) {
        return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    // Update the issue
    const newExpectedData = {
        ...issue.expected_data,
        customer_decision: decision
    };

    await supabaseAdmin.from("logistics_issues").update({
        expected_data: newExpectedData,
        status: "RESOLVED",
        resolved_at: new Date().toISOString()
    }).eq("id", issueId);

    // If accepted, update the order status back to IN_FULFILLMENT or PROCESSING
    if (decision === "ACCEPT") {
        await supabaseAdmin.from("orders").update({ logistics_status: "IN_FULFILLMENT" }).eq("id", issue.order_id);
        
        try {
            const { sendStatusNotification } = await import("@/lib/order-emails");
            await sendStatusNotification(issue.order_id, "CUSTOMER_ACCEPTED_ALTERNATIVE");
        } catch(e) {}
    } else {
        await supabaseAdmin.from("orders").update({ logistics_status: "CUSTOMER_REQUESTED_REFUND" }).eq("id", issue.order_id);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
`;
fs.writeFileSync(file, content);
console.log('Created Account Exception Resolve API');
