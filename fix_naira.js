
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
  if (content.includes("?{")) {
    let newContent = content.replace(/>\?\{/g, ">?{")
                            .replace(/\"\?\{/g, "\"?{")
                            .replace(/ \?\{/g, " ?{")
                            .replace(/<span>\?\{/g, "<span>?{");
    if (newContent !== content) {
      fs.writeFileSync(filepath, newContent, "utf-8");
      count++;
    }
  }
});
console.log("Fixed files:", count);

