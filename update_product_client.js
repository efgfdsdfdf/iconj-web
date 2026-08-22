const fs = require('fs');
let content = fs.readFileSync('src/app/shop/[id]/ProductDetailsClient.tsx', 'utf8');

// 1. Add moq and pricing tiers to state initialization
content = content.replace(
  'const [qty, setQty] = useState(1);',
  \const moq = product.moq || 1;
  const pricingTiers = product.pricing_tiers || [];
  const [qty, setQty] = useState(moq);

  const getCurrentPrice = () => {
    const basePrice = Number(product.base_selling_price) || 0;
    if (!pricingTiers || pricingTiers.length === 0) return basePrice;
    
    const sortedTiers = [...pricingTiers].sort((a, b) => b.minQty - a.minQty);
    for (const tier of sortedTiers) {
      if (qty >= tier.minQty) {
        return tier.price;
      }
    }
    return basePrice;
  };
  
  const currentPrice = getCurrentPrice();\
);

// 2. Update handleAddToCart payload
content = content.replace(
  'price: product.base_selling_price,',
  \price: currentPrice,
      basePrice: Number(product.base_selling_price) || 0,
      moq: moq,
      pricingTiers: pricingTiers,\
);

// 3. Update the price display block and add Wholesale Table
const priceUI = \
        <div className="mb-6 pb-6 border-b">
          <div className="flex flex-col gap-2">
            <div className="flex items-end gap-3">
              <span className="text-3xl md:text-4xl font-black text-slate-900">?{currentPrice.toLocaleString()}</span>
              <span className="text-sm font-semibold text-slate-500 mb-1.5">/ unit</span>
            </div>
            
            {pricingTiers.length > 0 && (
              <div className="mt-4 bg-blue-50/50 rounded-lg p-4 border border-blue-100">
                <p className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
                  Wholesale Pricing Tiers
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {pricingTiers.map((tier: any, idx: number) => {
                    const isActive = qty >= tier.minQty && (!tier.maxQty || qty <= tier.maxQty);
                    return (
                      <div key={idx} className={\p-2 rounded border text-center \\}>
                        <div className="text-xs font-semibold text-slate-600 mb-1">
                          {tier.minQty} {tier.maxQty ? \- \\ : '+'} units
                        </div>
                        <div className={\ont-bold \\}>
                          ?{tier.price.toLocaleString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {moq > 1 && (
              <p className="text-sm font-medium text-orange-600 mt-2">Minimum Order Quantity: {moq} units</p>
            )}
          </div>
        </div>
\;

content = content.replace(
  /<div className="mb-6 pb-6 border-b">[\s\S]*?<\/div>/m,
  priceUI
);

// 4. Update Quantity Selector to respect MOQ
content = content.replace(
  \onClick={() => setQty(Math.max(1, qty - 1))}\,
  \onClick={() => setQty(Math.max(moq, qty - 1))} disabled={qty <= moq} className={\\\p-2 transition-colors \\\\}\
);
content = content.replace(
  \className="w-16 text-center border-x py-2 font-medium"\,
  \className="w-16 text-center border-x py-2 font-medium bg-slate-50"\
);
content = content.replace(
  \<button onClick={() => setQty(Math.max(1, qty - 1))} className="p-2 hover:bg-slate-100 text-slate-600 transition-colors">\,
  \<button onClick={() => setQty(Math.max(moq, qty - 1))} disabled={qty <= moq} className={\\\p-2 transition-colors \\\\}>\
);


fs.writeFileSync('src/app/shop/[id]/ProductDetailsClient.tsx', content, 'utf8');
