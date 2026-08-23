const fs = require('fs');
let html = fs.readFileSync('alibaba_test.html', 'utf8');

// The main images on Alibaba usually start with https://s.alicdn.com/@sc04/kf/
const imgs = Array.from(html.matchAll(/(https:\/\/s\.alicdn\.com\/@sc04\/kf\/[^"'\s\\]+\.(?:jpg|png|jpeg))/gi))
                 .map(m => m[1]);

const uniqueImgs = [...new Set(imgs)];
console.log('Found images:', uniqueImgs.slice(0, 5));

const priceMatch = html.match(/"price":"([0-9.]+)"/i) || html.match(/"minPrice":([0-9.]+)/i);
console.log('Found price:', priceMatch ? priceMatch[1] : 'none');