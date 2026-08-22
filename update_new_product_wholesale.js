const fs = require('fs');
let content = fs.readFileSync('src/app/admin/products/new/page.tsx', 'utf8');

// 1. Add pricingTiers and moq to state
content = content.replace(
  'const [formData, setFormData] = useState({',
  \const [pricingTiers, setPricingTiers] = useState<any[]>([]);
  const [moq, setMoq] = useState(1);
  const [formData, setFormData] = useState({\
);

// 2. Add pricing tier builder UI
const pricingUI = \
          {/* WHOLESALE PRICING BUILDER */}
          <Card className="border-none shadow-sm ring-1 ring-blue-100">
            <CardHeader className="bg-blue-50/50">
              <CardTitle className="text-blue-900 flex justify-between items-center">
                Wholesale Pricing Tiers
                <Button type="button" variant="outline" size="sm" onClick={() => setPricingTiers([...pricingTiers, { minQty: moq, maxQty: null, price: formData.selling_price ? parseFloat(formData.selling_price) : 0 }])}>
                  <Plus className="w-4 h-4 mr-2" /> Add Tier
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Minimum Order Quantity (MOQ)</Label>
                  <Input type="number" min="1" value={moq} onChange={e => setMoq(parseInt(e.target.value) || 1)} />
                  <p className="text-xs text-slate-500">Customers cannot order less than this amount.</p>
                </div>
              </div>
              
              {pricingTiers.length > 0 ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-12 gap-4 text-xs font-bold text-slate-500 uppercase tracking-wider px-2">
                    <div className="col-span-3">Min Qty</div>
                    <div className="col-span-3">Max Qty (Leave empty for +)</div>
                    <div className="col-span-4">Unit Price (?)</div>
                    <div className="col-span-2"></div>
                  </div>
                  {pricingTiers.map((tier, index) => (
                    <div key={index} className="grid grid-cols-12 gap-4 items-start bg-slate-50 p-2 rounded-md">
                      <div className="col-span-3">
                        <Input type="number" min="1" value={tier.minQty} onChange={(e) => {
                          const newTiers = [...pricingTiers];
                          newTiers[index].minQty = parseInt(e.target.value) || 1;
                          setPricingTiers(newTiers);
                        }} />
                      </div>
                      <div className="col-span-3">
                        <Input type="number" placeholder="e.g. 5, or leave empty" value={tier.maxQty || ''} onChange={(e) => {
                          const newTiers = [...pricingTiers];
                          newTiers[index].maxQty = e.target.value ? parseInt(e.target.value) : null;
                          setPricingTiers(newTiers);
                        }} />
                      </div>
                      <div className="col-span-4">
                        <Input type="number" value={tier.price} onChange={(e) => {
                          const newTiers = [...pricingTiers];
                          newTiers[index].price = parseFloat(e.target.value) || 0;
                          setPricingTiers(newTiers);
                        }} />
                        <div className="text-xs mt-1 text-slate-500">
                          Margin: <span className={tier.price - parseFloat(formData.cost_price || '0') > 0 ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold'}>
                            ?{((tier.price || 0) - parseFloat(formData.cost_price || '0')).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="col-span-2 flex justify-end">
                        <Button type="button" variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => setPricingTiers(pricingTiers.filter((_, i) => i !== index))}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-slate-500 p-4 bg-slate-50 rounded-md border text-center">
                  No pricing tiers added. The product will use the Base Selling Price for all quantities.
                </div>
              )}
            </CardContent>
          </Card>
\;

content = content.replace(
  '          {/* BASIC INFORMATION */}',
  pricingUI + '\\n\\n          {/* BASIC INFORMATION */}'
);

// 3. Inject moq and pricing_tiers into the createProduct payload
content = content.replace(
  'is_configurable: false,',
  \is_configurable: false,
          moq: moq,
          pricing_tiers: pricingTiers,\
);

fs.writeFileSync('src/app/admin/products/new/page.tsx', content, 'utf8');
