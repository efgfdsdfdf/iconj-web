const fs = require('fs');
let content = fs.readFileSync('src/app/admin/products/new/page.tsx', 'utf8');

// Add categories state
content = content.replace(
  'const [loading, setLoading] = useState(false);',
  \const [loading, setLoading] = useState(false);
  const [categoriesList, setCategoriesList] = useState<string[]>(["Nursery & Furniture", "Baby Feeding & Nursing", "Baby Care & Bath", "Baby Clothing & Accessories", "Baby Travel", "Toys & Development", "Maternity & Mother Care", "Gifts & Bundles"]);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase.from("store_settings").select("value").eq("id", "homepage_categories").single();
      if (data?.value && Array.isArray(data.value)) {
        setCategoriesList(data.value.map((c: any) => c.name));
      }
    };
    fetchCategories();
  }, [supabase]);\
);

// Add useEffect import if not present (useState is already there)
content = content.replace(
  'import { useState } from "react";',
  'import { useState, useEffect } from "react";'
);

// Replace hardcoded select options
content = content.replace(
  \                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    <option>Nursery & Furniture</option>
                    <option>Baby Feeding & Nursing</option>
                    <option>Baby Care & Bath</option>
                    <option>Baby Clothing & Accessories</option>
                    <option>Baby Travel</option>
                    <option>Toys & Development</option>
                    <option>Maternity & Mother Care</option>
                    <option>Gifts & Bundles</option>
                  </select>\,
  \                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    <option value="">Select Category...</option>
                    {categoriesList.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>\
);

fs.writeFileSync('src/app/admin/products/new/page.tsx', content, 'utf8');
