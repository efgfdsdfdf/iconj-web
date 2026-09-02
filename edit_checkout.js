const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'src/app/checkout/page.tsx');
let content = fs.readFileSync(file, 'utf8');

// Add state
content = content.replace(
  /const \[step, setStep\] = useState<"address" \| "payment">("address");/,
  `const [step, setStep] = useState<"address" | "payment">("address");\n  const [termsAccepted, setTermsAccepted] = useState(false);`
);

// Disable button
content = content.replace(
  'disabled={loading}',
  'disabled={loading || !termsAccepted}'
);

// Add Checkbox UI
const ui = `
                  <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                    <input 
                      type="checkbox" 
                      id="termsCheckbox" 
                      className="mt-1 w-4 h-4 text-amber-600 rounded border-amber-300 focus:ring-amber-500" 
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                    />
                    <label htmlFor="termsCheckbox" className="text-xs text-amber-900 leading-relaxed cursor-pointer select-none">
                      I confirm that my measurements, customization selections and order details are correct. I understand that customized products are fulfilled according to the specifications submitted with my order and that certain customizations may be subject to supplier availability. If a requested specification cannot be fulfilled, ICONJ will contact me to discuss an available alternative or the applicable resolution.
                    </label>
                  </div>
                  
                  <Button 
`;
content = content.replace('<Button \n                    onClick={handleCheckout}', ui + '                    onClick={handleCheckout}');

fs.writeFileSync(file, content);
console.log('Done modifying checkout page');
