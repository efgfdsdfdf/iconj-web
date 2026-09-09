import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ==========================================
// TYPES
// ==========================================
export interface SegmentRule {
  field: 'total_spent' | 'order_count' | 'last_order_days_ago' | 'marketing_opt_in' | 'role' | 'cart_abandoned' | 'last_visited_days_ago';
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'is_true' | 'is_false';
  value?: string | number | boolean;
}

export interface CustomerSegment {
  id: string;
  name: string;
  filter_rules: SegmentRule[];
}

// ==========================================
// SEGMENT EVALUATION ENGINE
// ==========================================

/**
 * Generates a Postgres SQL WHERE clause based on segment rules.
 * This is used to query the `profiles` table dynamically.
 */
function buildSegmentQuery(rules: SegmentRule[]): string {
  if (!rules || rules.length === 0) return 'TRUE';

  const clauses = rules.map((rule) => {
    let fieldMapping = rule.field as string;
    
    // Virtual fields
    if (rule.field === 'last_order_days_ago') {
      fieldMapping = `EXTRACT(DAY FROM NOW() - last_order_at)`;
    } else if (rule.field === 'last_visited_days_ago') {
      fieldMapping = `EXTRACT(DAY FROM NOW() - last_visited_at)`;
    } else if (rule.field === 'cart_abandoned') {
      // For now, this is a placeholder. Complex joins might be needed or handled via views.
      // Assuming a boolean field or checking if there's an active cart event.
      // We will skip complex joins for this basic rule builder and rely on events.
      return 'TRUE'; // Skip in SQL, handle in JS if needed, or assume basic profile data.
    }

    const value = typeof rule.value === 'string' ? `'${rule.value}'` : rule.value;

    switch (rule.operator) {
      case 'eq': return `${fieldMapping} = ${value}`;
      case 'neq': return `${fieldMapping} != ${value}`;
      case 'gt': return `${fieldMapping} > ${value}`;
      case 'gte': return `${fieldMapping} >= ${value}`;
      case 'lt': return `${fieldMapping} < ${value}`;
      case 'lte': return `${fieldMapping} <= ${value}`;
      case 'is_true': return `${fieldMapping} = TRUE`;
      case 'is_false': return `${fieldMapping} = FALSE`;
      default: return 'TRUE';
    }
  });

  return clauses.join(' AND ');
}

/**
 * Returns a list of user IDs that match a given segment.
 */
export async function getSegmentMembers(segmentId: string): Promise<string[]> {
  try {
    // 1. Fetch the segment definition
    const { data: segment, error: segError } = await supabaseAdmin
      .from('customer_segments')
      .select('*')
      .eq('id', segmentId)
      .single();

    if (segError || !segment) {
      console.error('[Segmentation] Segment not found:', segmentId);
      return [];
    }

    // 2. Build the query
    // Supabase JS client doesn't support raw string WHERE clauses easily without RPC.
    // So we'll fetch all opted-in profiles and filter in memory, or use a Postgres function.
    // For safety and performance at small/medium scale, we fetch essential fields and evaluate in memory.
    
    // Fetch base profiles (only those opted in to marketing to be safe)
    const { data: profiles, error: profError } = await supabaseAdmin
      .from('profiles')
      .select('id, total_spent, order_count, last_order_at, marketing_opt_in, role, last_visited_at')
      .eq('marketing_opt_in', true);

    if (profError || !profiles) return [];

    // 3. Evaluate rules in memory
    const rules = segment.filter_rules as SegmentRule[];
    
    const matchedProfiles = profiles.filter(profile => {
      return rules.every(rule => {
        let profileValue: any = profile[rule.field as keyof typeof profile];

        // Handle virtual date fields
        if (rule.field === 'last_order_days_ago') {
          if (!profile.last_order_at) return false;
          const diffTime = Math.abs(new Date().getTime() - new Date(profile.last_order_at).getTime());
          profileValue = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        } else if (rule.field === 'last_visited_days_ago') {
          if (!profile.last_visited_at) return false;
          const diffTime = Math.abs(new Date().getTime() - new Date(profile.last_visited_at).getTime());
          profileValue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }

        // Compare
        switch (rule.operator) {
          case 'eq': return profileValue === rule.value;
          case 'neq': return profileValue !== rule.value;
          case 'gt': return Number(profileValue) > Number(rule.value);
          case 'gte': return Number(profileValue) >= Number(rule.value);
          case 'lt': return Number(profileValue) < Number(rule.value);
          case 'lte': return Number(profileValue) <= Number(rule.value);
          case 'is_true': return profileValue === true;
          case 'is_false': return profileValue === false;
          default: return true;
        }
      });
    });

    const matchedIds = matchedProfiles.map(p => p.id);

    // 4. Update cached count
    await supabaseAdmin
      .from('customer_segments')
      .update({
        cached_count: matchedIds.length,
        last_evaluated_at: new Date().toISOString()
      })
      .eq('id', segmentId);

    return matchedIds;

  } catch (error) {
    console.error('[Segmentation] Error evaluating segment:', error);
    return [];
  }
}
