
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function migrate() {
  const { data: products } = await supabase.from('products').select('id, category, sku');
  
  let counters = {};
  for (const p of products) {
    if (!p.sku || !p.sku.startsWith('ICONJ-')) {
      const category = p.category || 'PROD';
      const firstWord = category.split(/[^a-zA-Z]/).find(w => w.length > 0) || 'PROD';
      let prefix = firstWord.toUpperCase().substring(0, 6);
      if (prefix === 'MATERN') prefix = 'MOM';
      
      counters[prefix] = (counters[prefix] || 0) + 1;
      const newSku = \ICONJ-\-\\;
      
      console.log('Migrating', p.id, 'to', newSku);
      await supabase.from('products').update({ sku: newSku }).eq('id', p.id);
    }
  }
  console.log('Migration complete.');
}
migrate();

