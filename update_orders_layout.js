const fs = require('fs');
let content = fs.readFileSync('src/app/account/orders/page.tsx', 'utf8');

// Also import extra icons
content = content.replace(
  'import { Package, Truck, CheckCircle2, Clock } from "lucide-react";',
  'import { Package, Truck, CheckCircle2, Clock, User, MapPin, AlertCircle, MessageCircle } from "lucide-react";\\nimport { LogoutButton } from "../LogoutButton";'
);

const newLayout = \<div className="bg-slate-50 min-h-screen pb-12">
      <div className="bg-white border-b shadow-sm mb-8">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-slate-900">My Orders</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar Navigation */}
          <div className="w-full lg:w-64 shrink-0">
            <Card className="border-none shadow-sm overflow-hidden">
              <nav className="flex flex-col">
                <Link href="/account" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 border-l-4 border-transparent text-slate-700 font-medium">
                  <User className="w-5 h-5 text-slate-500" /> Account Overview
                </Link>
                <Link href="/account/orders" className="flex items-center gap-3 px-4 py-3 bg-slate-100 border-l-4 border-blue-500 font-bold text-slate-900 border-t">
                  <Package className="w-5 h-5 text-blue-500" /> My Orders
                </Link>
                <Link href="/account/addresses" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 border-l-4 border-transparent text-slate-700 font-medium border-t">
                  <MapPin className="w-5 h-5 text-slate-400" /> Saved Addresses
                </Link>
                <Link href="/account/issues" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 border-l-4 border-transparent text-slate-700 font-medium border-t">
                  <AlertCircle className="w-5 h-5 text-slate-400" /> Returns & Issues
                </Link>
                <Link href="/account/support" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 border-l-4 border-transparent text-slate-700 font-medium border-t">
                  <MessageCircle className="w-5 h-5 text-slate-400" /> Contact Support
                </Link>
                <div className="p-4 border-t bg-slate-50">
                  <LogoutButton />
                </div>
              </nav>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-slate-500">View and track all your recent purchases</p>
              </div>
              <Link href="/shop">
                <Button variant="outline">Continue Shopping</Button>
              </Link>
            </div>
\;

content = content.replace(
  '<div className="container mx-auto px-4 py-8 max-w-5xl">\\n      <div className="flex items-center justify-between mb-8">\\n        <div>\\n          <h1 className="text-2xl font-bold text-slate-900">My Orders</h1>\\n          <p className="text-slate-500">View and track all your recent purchases</p>\\n        </div>\\n        <Link href="/shop">\\n          <Button variant="outline">Continue Shopping</Button>\\n        </Link>\\n      </div>',
  newLayout
);

content = content.replace(
  '        )}\\n      </div>\\n    </div>\\n  );',
  '        )}\\n      </div>\\n    </div>\\n    </div>\\n    </div>\\n  );'
);

fs.writeFileSync('src/app/account/orders/page.tsx', content, 'utf8');
