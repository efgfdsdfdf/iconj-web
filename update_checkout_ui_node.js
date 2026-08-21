const fs = require('fs');
let content = fs.readFileSync('src/app/checkout/page.tsx', 'utf8');

content = content.replace(
  \<div className="space-y-2">
                      <Label>Delivery Address</Label>\,
  \{savedAddress && (
                      <div className="flex items-start gap-3 p-4 border rounded-lg bg-blue-50/50 border-blue-100 mb-6">
                        <input 
                          type="checkbox" 
                          checked={useSavedAddress} 
                          onChange={(e) => setUseSavedAddress(e.target.checked)}
                          className="w-4 h-4 mt-1 text-blue-600 rounded"
                          id="use-saved"
                        />
                        <label htmlFor="use-saved" className="text-sm font-medium cursor-pointer text-slate-900">
                          Deliver to my saved address<br/>
                          <span className="text-slate-500 font-normal block mt-1">{savedAddress.street}, {savedAddress.city}, {savedAddress.state}</span>
                        </label>
                      </div>
                    )}

                    <div className={useSavedAddress ? "hidden" : "space-y-6"}>
                      <div className="space-y-2">
                        <Label>Delivery Address</Label>\
);

content = content.replace(
  \<div className="space-y-2">
                        <Label>City / L.G.A</Label>
                        <Input required value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                      </div>
                    </div>\,
  \<div className="space-y-2">
                        <Label>City / L.G.A</Label>
                        <Input required={!useSavedAddress} value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                      </div>
                    </div>
                    </div>\
);

content = content.replace(
  \<Input required placeholder="Street address, apartment, suite, etc."\,
  \<Input required={!useSavedAddress} placeholder="Street address, apartment, suite, etc."\
);
content = content.replace(
  \<select required className="flex h-10 w-full\,
  \<select required={!useSavedAddress} className="flex h-10 w-full\
);

fs.writeFileSync('src/app/checkout/page.tsx', content, 'utf8');
