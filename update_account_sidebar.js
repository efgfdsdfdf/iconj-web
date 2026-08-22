const fs = require('fs');
let content = fs.readFileSync('src/app/account/page.tsx', 'utf8');

if (!content.includes('Contact Support')) {
  content = content.replace(
    '<Link href="/account/issues" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 border-l-4 border-transparent text-slate-700 font-medium border-t">',
    '<Link href="/account/issues" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 border-l-4 border-transparent text-slate-700 font-medium border-t">\n                  <AlertCircle className="w-5 h-5 text-slate-400" /> Returns & Issues\n                </Link>\n                <Link href="/account/support" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 border-l-4 border-transparent text-slate-700 font-medium border-t">\n                  <MessageCircle className="w-5 h-5 text-slate-400" /> Contact Support\n                </Link>'
  );
  
  // also need to import MessageCircle
  content = content.replace('AlertCircle,', 'AlertCircle, MessageCircle,');

  fs.writeFileSync('src/app/account/page.tsx', content, 'utf8');
}
