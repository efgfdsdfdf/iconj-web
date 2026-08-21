const fs = require('fs');
let content = fs.readFileSync('src/app/track/page.tsx', 'utf8');
content = content.replace(
  '<div className="text-right">\n                  <p className="text-sm text-slate-500 mb-1">Date Placed</p>\n                  <p className="font-semibold text-slate-900">{new Date(order.created_at).toLocaleDateString()}</p>\n                </div>',
  \<div className="text-right">
                  <p className="text-sm text-slate-500 mb-1">Date Placed</p>
                  <p className="font-semibold text-slate-900">{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              {order.tracking_number && (
                <div className="mb-6 p-4 bg-slate-50 rounded-lg border flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <p className="text-sm text-slate-500 font-semibold mb-1">Shipping Details</p>
                    <div className="flex items-center gap-2">
                      <Truck className="w-5 h-5 text-blue-600" />
                      <span className="font-bold text-slate-900">{order.shipping_carrier || "Carrier"}</span>
                      <span className="text-slate-400">•</span>
                      <span className="font-mono text-slate-700">{order.tracking_number}</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={\https://parcelsapp.com/en/tracking/\\} target="_blank" rel="noopener noreferrer">
                      Track on parcelsapp
                    </a>
                  </Button>
                </div>
              )}\
);
fs.writeFileSync('src/app/track/page.tsx', content, 'utf8');
