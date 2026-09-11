const fs = require('fs');
const path = require('path');

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

// 1. Native Tables
replaceInFile('src/app/admin/shipping/rates/page.tsx', [
    ['<table className="w-full text-sm text-left">', '<div className="overflow-x-auto"><table className="w-full text-sm text-left min-w-[600px]">'],
    ['<table className="w-full text-sm text-left text-slate-500">', '<div className="overflow-x-auto"><table className="w-full text-sm text-left text-slate-500 min-w-[600px]">'],
    ['</table>', '</table></div>']
]);

replaceInFile('src/app/admin/ddp/DDPDashboardClient.tsx', [
    ['<table className="w-full text-sm text-left border rounded">', '<div className="overflow-x-auto"><table className="w-full text-sm text-left border rounded min-w-[600px]">']
]);
// Note: we'll have to manually close the div for DDP or use regex. Wait, DDPDashboardClient has multiple tables.
// Let's use regex for DDPDashboardClient
let ddpContent = fs.readFileSync('src/app/admin/ddp/DDPDashboardClient.tsx', 'utf8');
ddpContent = ddpContent.replace(/<table className="w-full text-sm text-left border rounded">([\s\S]*?)<\/table>/g, '<div className="overflow-x-auto"><table className="w-full text-sm text-left border rounded min-w-[600px]">$1</table></div>');
fs.writeFileSync('src/app/admin/ddp/DDPDashboardClient.tsx', ddpContent);


// 2. Flex Headers (flex justify-between items-center -> flex flex-col md:flex-row md:justify-between md:items-center gap-4)
const flexHeaderFiles = [
    'src/app/admin/quotations/page.tsx',
    'src/app/admin/products/import/page.tsx',
    'src/app/admin/supplier/page.tsx',
    'src/app/admin/shipping/rates/page.tsx',
    'src/app/admin/shipping/missing-data/page.tsx',
    'src/app/admin/settings/logistics/LogisticsSettingsClient.tsx'
];

flexHeaderFiles.forEach(file => {
    replaceInFile(file, [
        ['className="flex justify-between items-center"', 'className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4"'],
        ['className="flex items-center justify-between mb-8"', 'className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4"'],
        ['className="flex justify-between items-center mb-8"', 'className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4"']
    ]);
});

// 3. Grid Fallbacks
replaceInFile('src/app/admin/shipping/missing-data/page.tsx', [
    ['className="grid grid-cols-4 gap-4"', 'className="grid grid-cols-2 md:grid-cols-4 gap-4"']
]);

replaceInFile('src/app/admin/marketing/segments/new/page.tsx', [
    ['className="grid grid-cols-3 gap-2"', 'className="grid grid-cols-1 sm:grid-cols-3 gap-2"']
]);

['src/app/admin/products/new/page.tsx', 'src/app/admin/products/[id]/edit/page.tsx'].forEach(file => {
    replaceInFile(file, [
        ['className="grid grid-cols-4 sm:grid-cols-5 gap-4 mt-6"', 'className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4 mt-6"'],
        ['className="grid grid-cols-12 gap-4 text-xs font-bold text-slate-500 uppercase tracking-wider px-2"', 'className="hidden sm:grid grid-cols-12 gap-4 text-xs font-bold text-slate-500 uppercase tracking-wider px-2"'],
        ['className="grid grid-cols-12 gap-4 items-start bg-slate-50 p-2 rounded-md"', 'className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start bg-slate-50 p-2 rounded-md"']
    ]);
});

replaceInFile('src/components/admin/CampaignForm.tsx', [
    ['className="grid grid-cols-2 gap-6', 'className="grid grid-cols-1 sm:grid-cols-2 gap-6']
]);

// 4. Fixed Widths & Sticky Headers
replaceInFile('src/app/admin/quotations/page.tsx', [
    ['className="relative w-64"', 'className="relative w-full sm:w-64"'],
    ['className="w-48"', 'className="w-full sm:w-48"'],
    ['className="flex items-center gap-3"', 'className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto"'],
    ['className="flex justify-between items-center p-4 border-t"', 'className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t"']
]);

replaceInFile('src/app/admin/products/AdminProductListClient.tsx', [
    ['className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-4"', 'className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 sm:px-6 py-3 rounded-full shadow-2xl flex flex-col sm:flex-row items-center gap-2 sm:gap-4 w-[90vw] sm:w-auto"']
]);

replaceInFile('src/app/admin/ddp/DDPDashboardClient.tsx', [
    ['className="flex gap-2"', 'className="flex flex-col sm:flex-row gap-2"'],
    ['className="max-w-[150px]"', 'className="w-full sm:max-w-[150px]"'],
    ['className="flex items-center justify-between bg-indigo-50', 'className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-indigo-50']
]);

replaceInFile('src/app/admin/orders/[id]/page.tsx', [
    ['className="flex gap-4 items-center"', 'className="flex flex-col sm:flex-row gap-4 sm:items-center"'],
    ['className="text-right flex flex-col items-end gap-2"', 'className="text-left sm:text-right flex flex-col items-start sm:items-end gap-2"']
]);

replaceInFile('src/app/admin/orders/[id]/components/SupplierStatusPanel.tsx', [
    ['className="flex items-center gap-4 p-4', 'className="flex flex-col sm:flex-row sm:items-center gap-4 p-4']
]);

replaceInFile('src/app/admin/orders/[id]/components/EmailLogsPanel.tsx', [
    ['className="flex items-center justify-between border', 'className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border']
]);

replaceInFile('src/app/admin/products/DdpEstimateModal.tsx', [
    ['className="flex items-center sm:justify-between', 'className="flex flex-col sm:flex-row items-stretch sm:justify-between gap-4']
]);

replaceInFile('src/app/admin/sellers/page.tsx', [
    ['className="flex gap-2 mb-8 border-b border-slate-200 pb-0"', 'className="flex gap-2 mb-8 border-b border-slate-200 pb-0 overflow-x-auto shrink-0"']
]);

replaceInFile('src/app/admin/quotations/[id]/page.tsx', [
    ['className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent mb-6"', 'className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent mb-6 overflow-x-auto flex-nowrap"']
]);

replaceInFile('src/app/admin/supplier/[id]/page.tsx', [
    ['className="flex justify-between items-center p-4 bg-white', 'className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-white'],
    ['className="flex items-center gap-4"', 'className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto"']
]);

replaceInFile('src/app/admin/admin/page.tsx', [
    ['className="bg-red-50 ... flex items-center justify-between"', 'className="bg-red-50 p-4 rounded border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"']
]);

console.log("All patches applied.");
