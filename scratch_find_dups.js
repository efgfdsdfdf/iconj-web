require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findDuplicates() {
  const { data: sellers } = await supabase
    .from('sellers')
    .select('id, profile_id, status, profiles(email)')
    .order('created_at', { ascending: false });
    
  const counts = {};
  for (const s of sellers) {
    if (!counts[s.profile_id]) {
      counts[s.profile_id] = [];
    }
    counts[s.profile_id].push({ id: s.id, status: s.status, email: s.profiles?.email });
  }
  
  for (const profileId in counts) {
    if (counts[profileId].length > 1) {
      console.log(`Duplicate found for profile: ${profileId}`);
      console.log(counts[profileId]);
    }
  }
}

findDuplicates();
