const fs = require('fs');
let content = fs.readFileSync('src/app/account/page.tsx', 'utf8');

content = content.replace(
  '                <Link href="/account/support" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 border-l-4 border-transparent text-slate-700 font-medium border-t">\\n                  <MessageCircle className="w-5 h-5 text-slate-400" /> Contact Support\\n                </Link>\\n                  <AlertCircle className="w-5 h-5 text-slate-400" /> My Issues\\n                </Link>',
  '                <Link href="/account/support" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 border-l-4 border-transparent text-slate-700 font-medium border-t">\\n                  <MessageCircle className="w-5 h-5 text-slate-400" /> Contact Support\\n                </Link>'
);

fs.writeFileSync('src/app/account/page.tsx', content, 'utf8');
