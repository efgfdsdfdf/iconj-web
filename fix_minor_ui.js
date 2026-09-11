const fs = require('fs');

function replaceInFile(filePath, replacements) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    for (const [search, replace] of replacements) {
        content = content.split(search).join(replace);
    }
    
    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${filePath}`);
    }
}

// 1. Fix Shipping Title
replaceInFile('src/app/admin/shipping/page.tsx', [
    ['<h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">', '<h1 className="text-2xl font-bold text-slate-900 flex flex-wrap items-center gap-2">']
]);

// 2. Fix Quotation Pricing Inputs
replaceInFile('src/app/admin/quotations/[id]/page.tsx', [
    ['<div className="grid grid-cols-2 gap-4">', '<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">'],
    ['<div className="grid grid-cols-2 gap-6">', '<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">'] // just in case
]);

// 3. Fix DDP Dashboard Table Width
replaceInFile('src/app/admin/ddp/DDPDashboardClient.tsx', [
    ['min-w-[600px]', 'min-w-[800px]']
]);

// 4. Fix any other giant flex h1s just in case
const h1Files = [
    'src/app/admin/issues/[id]/page.tsx',
    'src/app/admin/supplier/[id]/page.tsx'
];
h1Files.forEach(file => {
    replaceInFile(file, [
        ['<h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">', '<h1 className="text-2xl font-bold text-slate-900 flex flex-wrap items-center gap-2">']
    ]);
});

console.log("All patches applied.");
