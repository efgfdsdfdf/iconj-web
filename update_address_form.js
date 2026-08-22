const fs = require('fs');
let content = fs.readFileSync('src/app/account/addresses/AddressForm.tsx', 'utf8');

content = content.replace(
  '  const [error, setError] = useState("");',
  \  const [error, setError] = useState("");
  const [formData, setFormData] = useState({ label: "", street: "", state: "", city: "", phone: "", is_default: false });\
);

content = content.replace(
  'const formData = new FormData(e.currentTarget);',
  'const submitData = new FormData(e.currentTarget);'
);

content = content.replace(
  'const res = await addAddress(formData);',
  'const res = await addAddress(submitData);'
);

content = content.replace(
  '(e.target as HTMLFormElement).reset();',
  'setFormData({ label: "", street: "", state: "", city: "", phone: "", is_default: false });'
);

// Replace Inputs
content = content.replace(
  '<Input name="label" required placeholder="Home" />',
  '<Input name="label" required placeholder="Home" value={formData.label} onChange={e => setFormData({...formData, label: e.target.value})} />'
);
content = content.replace(
  '<Input name="street" required placeholder="123 Main St" />',
  '<Input name="street" required placeholder="123 Main St" value={formData.street} onChange={e => setFormData({...formData, street: e.target.value})} />'
);
content = content.replace(
  /<select name="state" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">/,
  '<select name="state" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})}>'
);
content = content.replace(
  '<Input name="city" required />',
  '<Input name="city" required value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />'
);
content = content.replace(
  '<Input name="phone" required placeholder="08012345678" />',
  '<Input name="phone" required placeholder="08012345678" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />'
);
content = content.replace(
  '<input type="checkbox" name="is_default" id="is_default" className="w-4 h-4" />',
  '<input type="checkbox" name="is_default" id="is_default" className="w-4 h-4" checked={formData.is_default} onChange={e => setFormData({...formData, is_default: e.target.checked})} />'
);

fs.writeFileSync('src/app/account/addresses/AddressForm.tsx', content, 'utf8');
