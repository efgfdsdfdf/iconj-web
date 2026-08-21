const fs = require('fs');
let content = fs.readFileSync('src/app/checkout/page.tsx', 'utf8');

// 1. Add states
content = content.replace(
  'const [userId, setUserId] = useState<string | null>(null);',
  \const [userId, setUserId] = useState<string | null>(null);
  const [useSavedAddress, setUseSavedAddress] = useState(false);
  const [savedAddress, setSavedAddress] = useState<any>(null);\
);

// 2. Fetch profile in useEffect
content = content.replace(
  \setUserId(data.user.id);
        setFormData(prev => ({ ...prev, email: data.user?.email || "" }));\,
  \setUserId(data.user.id);
        
        supabase.from("profiles").select("*").eq("id", data.user.id).single().then(({ data: profile }) => {
          if (profile) {
            setFormData(prev => ({ 
              ...prev, 
              email: profile.email || data.user?.email || "",
              phone: profile.phone || "",
              firstName: profile.name ? profile.name.split(' ')[0] : "",
              lastName: profile.name ? profile.name.split(' ').slice(1).join(' ') : ""
            }));

            if (profile.address_street) {
              setSavedAddress({
                street: profile.address_street,
                city: profile.address_city,
                state: profile.address_state
              });
              setUseSavedAddress(true);
            }
          }
        });\
);

// 3. Handle checkout submission
content = content.replace(
  \ddress: {
            street: formData.address,
            city: formData.city,
            state: formData.state
          },\,
  \ddress: useSavedAddress && savedAddress ? {
            street: savedAddress.street,
            city: savedAddress.city,
            state: savedAddress.state
          } : {
            street: formData.address,
            city: formData.city,
            state: formData.state
          },
          saveAddress: !useSavedAddress && userId ? true : false,\
);

// 4. Update the form UI to conditionally show address fields
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

// Fix required tags for conditional fields
content = content.replace(
  \<Input required placeholder="Street address, apartment, suite, etc."\,
  \<Input required={!useSavedAddress} placeholder="Street address, apartment, suite, etc."\
);
content = content.replace(
  \<select required className="flex h-10 w-full\,
  \<select required={!useSavedAddress} className="flex h-10 w-full\
);


fs.writeFileSync('src/app/checkout/page.tsx', content, 'utf8');
