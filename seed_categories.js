const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function seedCategories() {
  console.log("Seeding categories...");
  
  const categories = [
    { name: "Newborn Essentials", slug: "newborn-essentials" },
    { name: "Baby Feeding", slug: "baby-feeding" },
    { name: "Baby Care & Bath", slug: "baby-care-bath" },
    { name: "Baby Safety", slug: "baby-safety" },
    { name: "Maternity", slug: "maternity" },
    { name: "Gifts & Bundles", slug: "gifts-bundles" }
  ];

  for (const cat of categories) {
    await supabase.from('categories').upsert(cat, { onConflict: 'slug' });
  }

  // Get ICON admin profile to make them the official store owner
  // In a real scenario we might have a specific UUID, but let's just grab the first admin
  const { data: admin } = await supabase.from('profiles').select('id').eq('role', 'admin').limit(1).single();
  
  if (admin) {
    console.log("Setting up ICON Official store...");
    
    // Check if business exists
    let { data: business } = await supabase.from('businesses').select('id').eq('owner_id', admin.id).limit(1).single();
    if (!business) {
      const { data: newBiz } = await supabase.from('businesses').insert({
        owner_id: admin.id,
        business_name: "ICON Official",
        business_type: "retail"
      }).select().single();
      business = newBiz;
    }

    // Check if seller exists
    let { data: seller } = await supabase.from('sellers').select('id').eq('profile_id', admin.id).limit(1).single();
    if (!seller) {
      const { data: newSeller } = await supabase.from('sellers').insert({
        profile_id: admin.id,
        business_id: business.id,
        seller_type: 'icon_official',
        status: 'approved'
      }).select().single();
      seller = newSeller;
    }

    // Check if store exists
    let { data: store } = await supabase.from('stores').select('id').eq('seller_id', seller.id).limit(1).single();
    if (!store) {
      const { data: newStore } = await supabase.from('stores').insert({
        seller_id: seller.id,
        store_name: "ICON Official",
        slug: "icon-official",
        is_active: true
      }).select().single();
      store = newStore;
    }

    console.log("Updating products with ICON Official store ID and category mapping...");
    const { data: products } = await supabase.from('products').select('id, category');
    
    for (const p of products) {
      let categorySlug = p.category ? p.category.toLowerCase().replace(/[^a-z0-9]+/g, '-') : null;
      let categoryId = null;
      
      if (categorySlug) {
        const { data: catRecord } = await supabase.from('categories').select('id').eq('slug', categorySlug).single();
        if (catRecord) categoryId = catRecord.id;
      }
      
      await supabase.from('products').update({
        store_id: store.id,
        seller_id: seller.id,
        category_id: categoryId,
        approval_status: 'approved',
        is_wholesale_enabled: true // Just for testing the UI
      }).eq('id', p.id);
    }
  }

  console.log("Done seeding.");
}

seedCategories().catch(console.error);
