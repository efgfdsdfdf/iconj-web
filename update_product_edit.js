const fs = require('fs');
let content = fs.readFileSync('src/app/shop/[id]/page.tsx', 'utf8');

// fetch user
content = content.replace(
  'const supabase = await createClient();',
  \const supabase = await createClient();\\n  const { data: { user } } = await supabase.auth.getUser();\\n  const isAdmin = user?.email === "ezeilodavid292@gmail.com";\
);

// add edit button to breadcrumb
content = content.replace(
  '<div className="container mx-auto px-4 py-3 flex items-center text-xs font-medium text-slate-500 overflow-x-auto whitespace-nowrap">',
  '<div className="container mx-auto px-4 py-3 flex items-center justify-between">\\n            <div className="flex items-center text-xs font-medium text-slate-500 overflow-x-auto whitespace-nowrap">'
);

content = content.replace(
  '<span className="text-slate-900 truncate max-w-[200px]">{product.name}</span>\\n          </div>\\n        </div>',
  '<span className="text-slate-900 truncate max-w-[200px]">{product.name}</span>\\n            </div>\\n            {isAdmin && (\\n              <Link href={\/admin/products/\/edit\} className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded hover:bg-blue-100 flex items-center gap-1 shrink-0">\\n                Edit Product\\n              </Link>\\n            )}\\n          </div>\\n        </div>'
);

fs.writeFileSync('src/app/shop/[id]/page.tsx', content, 'utf8');
