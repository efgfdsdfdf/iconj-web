const fs = require('fs');
let html = fs.readFileSync('alibaba_test.html', 'utf8');

html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ');
html = html.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ');
let text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

fs.writeFileSync('stripped_test.txt', text);