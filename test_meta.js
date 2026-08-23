const fs = require('fs');
let html = fs.readFileSync('alibaba_test.html', 'utf8');

// Find OG tags
const titleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);
const imgMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
console.log('Title:', titleMatch ? titleMatch[1] : 'none');
console.log('Image:', imgMatch ? imgMatch[1] : 'none');

// Find the huge script tag we saw earlier
const scriptTags = html.match(/<script[^>]*>(.*?)<\/script>/gs);
for (let script of scriptTags) {
  if (script.length > 50000) {
     // try to find JSON
     const jsonMatch = script.match(/window\.__global_config__\s*=\s*(.*?);\n/s) || script.match(/window\.detailData\s*=\s*(\{.*?\})\s*;/s);
     if (jsonMatch) {
        console.log('Found large JSON block!');
        try {
           const obj = JSON.parse(jsonMatch[1]);
           console.log('Keys:', Object.keys(obj));
        } catch(e) { console.log('Could not parse JSON'); }
     }
  }
}