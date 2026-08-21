
const fs = require("fs");
const path = require("path");

function walkSync(dir, callback) {
  fs.readdirSync(dir).forEach(file => {
    let filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      walkSync(filepath, callback);
    } else if (filepath.endsWith(".tsx")) {
      callback(filepath);
    }
  });
}

let count = 0;
walkSync("src", (filepath) => {
  let content = fs.readFileSync(filepath, "utf-8");
  let newContent = content.replace(/\?\{Number/g, "?{Number")
                          .replace(/\?\{\(Number/g, "?{(Number")
                          .replace(/\?\{order/g, "?{order")
                          .replace(/\?\{item/g, "?{item")
                          .replace(/\?\{total/g, "?{total")
                          .replace(/\?\{Math/g, "?{Math")
                          .replace(/\?\{subtotal/g, "?{subtotal")
                          .replace(/\?\{shipping/g, "?{shipping")
                          .replace(/\?\{getTotalPrice/g, "?{getTotalPrice");
                          
  if (newContent !== content) {
    fs.writeFileSync(filepath, newContent, "utf-8");
    count++;
  }
});
console.log("Fixed files:", count);

