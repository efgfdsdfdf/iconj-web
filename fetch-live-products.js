fetch('https://iconj.com.ng/shop')
  .then(r => r.text())
  .then(t => {
    const matches = [...t.matchAll(/href="\/shop\/([a-f0-9\-]+)"/g)];
    console.log(matches.map(m => m[1]).filter(id => id.length > 20).slice(0, 5));
  });
