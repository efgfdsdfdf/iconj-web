const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    for (const [search, replace] of replacements) {
        content = content.replace(search, replace);
    }
    if (content !== original) {
        fs.writeFileSync(filePath, content);
        console.log(`Updated ${filePath}`);
    }
}

// 1. src/app/how-to-measure/page.tsx
replaceInFile('src/app/how-to-measure/page.tsx', [
    [/The factory will make the necessary deductions to ensure it fits perfectly without rubbing the sides\./g, "The supplier will make the necessary deductions to ensure it fits perfectly without rubbing the sides."],
    [/We make your/gi, "Customized to your specifications"]
]);

// 2. src/app/iconj/page.tsx
replaceInFile('src/app/iconj/page.tsx', [
    [/Expert Installation/g, "Customized Options"],
    [/Professional measuring and fitting by our certified ICONJ installers\./g, "Choose the exact specifications for your space."],
    [/Sourced directly from top manufacturers globally for durability and style\./g, "Sourced directly from trusted suppliers globally for durability and style."],
    [/Delivery & Installation/g, "Delivery & Fulfillment"],
    [/Fast nationwide delivery with optional professional installation available\./g, "Fast nationwide delivery for your customized orders."]
]);

// 3. src/app/manifest.ts
replaceInFile('src/app/manifest.ts', [
    [/manufacturer/g, "trusted suppliers"]
]);

// 4. src/app/returns/page.tsx
replaceInFile('src/app/returns/page.tsx', [
    [/uniquely manufactured for you/g, "customized to your specifications"],
    [/Because we ship direct from the factory, we work closely with our manufacturing partners to resolve issues\. Our suppliers guarantee:/g, "Because we work directly with specialized suppliers, we coordinate closely with them to resolve issues. Our suppliers guarantee:"],
    [/If the entire unit is defective or manufactured incorrectly, the item will be remade at no cost to you\./g, "If the entire unit is defective or produced incorrectly based on your provided specifications, the item will be remade at no cost to you."],
    [/contact the factory/g, "contact the supplier"]
]);

// 5. src/app/shop/[id]/ProductDetailsClient.tsx
replaceInFile('src/app/shop/[id]/ProductDetailsClient.tsx', [
    [/The factory will make them to ensure it fits perfectly\./g, "The supplier will make them to ensure it fits perfectly."],
    [/installation_available: true/g, "installation_available: false"]
]);

// 6. src/app/shop/[id]/Reviews.tsx
replaceInFile('src/app/shop/[id]/Reviews.tsx', [
    [/the installation was very professional/g, "it was exactly what I ordered"],
    [/Direct factory pricing is real\./g, "The customized options were perfect."]
]);

// 7. src/app/shop/[id]/page.tsx
replaceInFile('src/app/shop/[id]/page.tsx', [
    [/Guaranteed factory quality\./g, "Guaranteed quality."]
]);

// 8. src/app/shop/page.tsx
replaceInFile('src/app/shop/page.tsx', [
    [/directly from manufacturers and official distributors\./g, "directly from trusted suppliers."],
    [/directly from manufacturers/g, "directly from suppliers"]
]);

// 9. src/app/terms-and-conditions/page.tsx
replaceInFile('src/app/terms-and-conditions/page.tsx', [
    [/manufacturers, wholesalers, installers, and independent sellers/g, "wholesalers, suppliers, and independent sellers"],
    [/Seller, Manufacturer, or Supplier/g, "Seller or Supplier"],
    [/specially manufactured items/g, "customized items"],
    [/manufacturing defect/g, "production defect"],
    [/Where a customer selects "Delivery \+ Installation," ICONJ acts as an intermediary connecting the customer with an approved independent installer\. ICONJ Global Services is not directly liable for damages incurred during independent installation, though we strictly vet our professionals and enforce a dispute resolution policy\./g, "ICONJ currently provides products only. Installation is not included. Customers are responsible for the installation of their customized products."]
]);

console.log("Replacements complete.");
