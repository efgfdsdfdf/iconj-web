const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'src/app/api/seller/products/[id]/route.ts');
let content = fs.readFileSync(file, 'utf8');

// Extract compare_at_price from request
content = content.replace(
  /name, sku, selling_price, description, stock_status,/,
  `name, sku, selling_price, compare_at_price, description, stock_status,`
);

// Add variants merge logic and update payload
content = content.replace(
  /const newApprovalStatus = existingProduct.approval_status === "rejected" \? "pending" : existingProduct.approval_status;\n    const \{ data, error \} = await supabaseAdmin.from\("products"\).update\(\{/,
  `const newApprovalStatus = existingProduct.approval_status === "rejected" ? "pending" : existingProduct.approval_status;
    
    // Merge variants
    const currentVariants = existingProduct.variants || {};
    const updatedVariants = {
      ...currentVariants,
      ...(compare_at_price ? { compare_at_price: parseFloat(compare_at_price) } : { compare_at_price: null })
    };

    const { data, error } = await supabaseAdmin.from("products").update({
      variants: updatedVariants,`
);

fs.writeFileSync(file, content);
console.log('Done modifying seller product edit API');
