const fs = require("fs"); 
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8")); 
const deps = Object.keys(pkg.dependencies || {}); 
const devDeps = Object.keys(pkg.devDependencies || {}); 
const MAX_DEPS = 80; 
const MAX_DEVDEPS = 80; 

function fail(msg) { 
  console.error(`\n[DEPS BUDGET] ❌ ${msg}\n`); 
  process.exit(1); 
} 

console.log(`[DEPS BUDGET] deps=${deps.length}, devDeps=${devDeps.length}`); 

if (deps.length > MAX_DEPS) {
  fail(`تجاوزت التبعيات الميزانية المخصصة لها: ${deps.length} > ${MAX_DEPS}`);
}
if (devDeps.length > MAX_DEVDEPS) {
  fail(`تجاوزت تبعيات التطوير الميزانية المخصصة لها: ${devDeps.length} > ${MAX_DEVDEPS}`);
}

console.log("[DEPS BUDGET] ✅ OK");
