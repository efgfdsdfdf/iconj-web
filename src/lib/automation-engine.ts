import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export type AutomationTrigger = 
  | 'signup' 
  | 'abandoned_cart' 
  | 'checkout_abandoned'
  | 'post_purchase' 
  | 'win_back' 
  | 'browse_abandon' 
  | 'review_request'
  | 'birthday';

export interface EnrollmentMetadata {
  sourceEventId?: string;
  cartId?: string;
  orderId?: string;
  productId?: string;
  [key: string]: any;
}

// ==========================================
// TRIGGER AUTOMATION
// ==========================================
export async function triggerAutomation(
  triggerEvent: AutomationTrigger,
  userId: string,
  metadata: EnrollmentMetadata = {}
): Promise<void> {
  try {
    // 1. Find all active flows for this trigger
    const { data: flows, error: flowError } = await supabaseAdmin
      .from('automation_flows')
      .select('*')
      .eq('trigger_event', triggerEvent)
      .eq('is_active', true);

    if (flowError || !flows || flows.length === 0) return;

    // 2. Check profile global opt-in
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('marketing_opt_in, last_order_at')
      .eq('id', userId)
      .single();

    if (!profile || profile.marketing_opt_in === false) {
      console.log(`[Automation] User ${userId} is opted out. Skipping.`);
      return;
    }

    // 3. Process each flow
    for (const flow of flows) {
      // Check Suppression: suppress_if_purchased
      if (flow.suppress_if_purchased && profile.last_order_at) {
        // If they purchased AFTER the trigger event occurred, suppress them.
        // For simplicity right now, if it's an abandoned cart flow, and they purchased in the last 24h, suppress.
        const lastOrderTime = new Date(profile.last_order_at).getTime();
        const now = new Date().getTime();
        const hoursSincePurchase = (now - lastOrderTime) / (1000 * 60 * 60);
        
        if (triggerEvent === 'abandoned_cart' || triggerEvent === 'checkout_abandoned') {
           if (hoursSincePurchase < 48) {
              console.log(`[Automation] Suppressed: User ${userId} purchased recently.`);
              continue;
           }
        }
      }

      // 4. Enroll User (Idempotent)
      // The DB has a UNIQUE(flow_id, user_id) constraint.
      // If we want multiple enrollments (e.g. they abandon cart again 2 months later),
      // we would need to check `max_enrollments_per_user` and delete old completed enrollments or update schema.
      // For now, simple UPSERT to restart the flow.
      const { error: enrollError } = await supabaseAdmin
        .from('automation_enrollments')
        .upsert({
          flow_id: flow.id,
          user_id: userId,
          status: 'ACTIVE',
          current_step: 0,
          next_action_at: new Date().toISOString(), // Ready to process step 0 immediately
          metadata: metadata
        }, {
          onConflict: 'flow_id, user_id'
        });

      if (!enrollError) {
        // Increment stats safely
        await supabaseAdmin.rpc('increment_flow_enrollment', { f_id: flow.id }).catch(() => {});
      }
    }
  } catch (error) {
    console.error('[Automation] Trigger error:', error);
  }
}

// ==========================================
// PROCESS DUE AUTOMATIONS (Called by Cron)
// ==========================================
export async function processAutomations(): Promise<void> {
  // 1. Fetch all ACTIVE enrollments where next_action_at <= NOW()
  const { data: enrollments, error: enrollError } = await supabaseAdmin
    .from('automation_enrollments')
    .select(`
      id, flow_id, user_id, current_step, metadata,
      automation_flows ( steps )
    `)
    .eq('status', 'ACTIVE')
    .lte('next_action_at', new Date().toISOString())
    .limit(50); // Batch processing

  if (enrollError || !enrollments || enrollments.length === 0) return;

  for (const enrollment of enrollments) {
    const steps = enrollment.automation_flows.steps as any[];
    const currentStepIndex = enrollment.current_step;

    // Check if flow is finished
    if (currentStepIndex >= steps.length) {
      await supabaseAdmin
        .from('automation_enrollments')
        .update({ status: 'COMPLETED', completed_at: new Date().toISOString() })
        .eq('id', enrollment.id);
      continue;
    }

    const step = steps[currentStepIndex];

    try {
      // Execute Step
      if (step.type === 'wait') {
        const delayMs = (step.delay_hours || 0) * 60 * 60 * 1000 + (step.delay_minutes || 0) * 60 * 1000;
        const nextTime = new Date(Date.now() + delayMs).toISOString();
        
        await supabaseAdmin
          .from('automation_enrollments')
          .update({
            current_step: currentStepIndex + 1,
            next_action_at: nextTime
          })
          .eq('id', enrollment.id);

      } else if (step.type === 'email') {
        // Fetch user email
        const { data: profile } = await supabaseAdmin.from('profiles').select('email, name').eq('id', enrollment.user_id).single();
        
        if (profile?.email) {
          // Fire email (we mock the send payload here, in reality we'd use resend)
          await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://iconj.com.ng'}/api/marketing/internal-send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` },
            body: JSON.stringify({
              to: profile.email,
              subject: step.subject,
              template: step.template,
              userId: enrollment.user_id,
              metadata: enrollment.metadata
            })
          }).catch(console.error);
        }

        // Move to next step immediately
        await supabaseAdmin
          .from('automation_enrollments')
          .update({
            current_step: currentStepIndex + 1,
            next_action_at: new Date().toISOString()
          })
          .eq('id', enrollment.id);
      }

    } catch (stepErr) {
      console.error(`[Automation] Error processing step for enrollment ${enrollment.id}:`, stepErr);
    }
  }
}
