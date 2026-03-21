/* governance/guard-pr.js 
* يفشل التكامل المستمر إذا انتهك طلب السحب قواعد الحوكمة. 
* 
* المتطلبات: 
* - يعمل في GitHub Actions مع GITHUB_TOKEN 
*/ 

const fs = require("fs"); 
const MAX_DEFAULT = 300; 

function die(msg) { 
  console.error(`\n[GOVERNANCE GUARD] ❌ ${msg}\n`); 
  process.exit(1); 
} 

function ok(msg) { 
  console.log(`[GOVERNANCE GUARD] ✅ ${msg}`); 
} 

async function ghApi(path) { 
  const token = process.env.GITHUB_TOKEN; 
  if (!token) die("GITHUB_TOKEN missing in environment."); 
  const res = await fetch(`https://api.github.com${path}`, {     
    headers: {       
      Authorization: `Bearer ${token}`, 
      "X-GitHub-Api-Version": "2022-11-28", 
      "User-Agent": "governance-guard"     
    }   
  }); 
  if (!res.ok) { 
    const text = await res.text(); 
    die(`خطأ في واجهة برمجة تطبيقات GitHub: ${res.status}: ${text}`);   
  } 
  return res.json(); 
} 

function loadPolicy() { 
  const policyPath = "governance/protected-paths.json"; 
  if (!fs.existsSync(policyPath)) die(`لم يتم العثور على ملف السياسة: ${policyPath}`);   
  const policy = JSON.parse(fs.readFileSync(policyPath, "utf8")); 
  return {     
    protected: policy.protected || [],     
    maxLines: policy.max_changed_lines_without_explicit_approval || MAX_DEFAULT   
  }; 
} 

function matchesProtected(file, protectedList) { 
  return protectedList.some((p) => file.startsWith(p)); 
} 

function hasExplicitApproval(body) { 
  return /EXPLICIT_APPROVAL:\s*YES/i.test(body || ""); 
} 

function isLargeRefactor(totalChanged, maxLines) { 
  return totalChanged > maxLines; 
} 

async function main() { 
  const { protected: protectedList, maxLines } = loadPolicy(); 
  const repo = process.env.GITHUB_REPOSITORY; 
  const prNumber = process.env.PR_NUMBER; 
  if (!repo) die("GITHUB_REPOSITORY missing."); 
  if (!prNumber) die("PR_NUMBER missing (set from GitHub Actions)."); 
  ok(`Repo: ${repo}, PR: #${prNumber}`); 
  
  const pr = await ghApi(`/repos/${repo}/pulls/${prNumber}`); 
  const files = await ghApi(`/repos/${repo}/pulls/${prNumber}/files?per_page=100`); 
  const body = pr.body || ""; 
  const explicit = hasExplicitApproval(body); 
  let protectedTouched = []; 
  let totalChanged = 0; 

  for (const f of files) { 
    const filename = f.filename; 
    totalChanged += (f.changes || 0); 
    if (matchesProtected(filename, protectedList)) { 
      protectedTouched.push(filename);     
    }   
  } 
  
  ok(`Total changed lines: ${totalChanged}`); 
  ok(`Protected files touched: ${protectedTouched.length}`); 

  if (protectedTouched.length > 0 && !explicit) { 
    die(`تم تعديل المناطق المحمية بدون موافقة صريحة. \n` + 
        `أضف هذا السطر إلى وصف طلب السحب: EXPLICIT_APPROVAL: YES\n` + 
        `الملفات:\n - ${protectedTouched.join("\n - ")}`);   
  } 

  if (isLargeRefactor(totalChanged, maxLines) && !explicit) { 
    die(`تم اكتشاف إعادة هيكلة كبيرة (${totalChanged} > ${maxLines}) بدون موافقة صريحة.\n` + 
        `أضف إلى وصف طلب السحب: EXPLICIT_APPROVAL: YES`); 
  }

  const forbiddenPatterns = [
    /package\.json$/i, 
    /^pnpm-lock\.yaml$/i, 
    /^yarn\.lock$/i, 
    /^package-lock\.json$/i   
  ]; 

  const touchedDeps = files.some((f) => forbiddenPatterns.some((r) => r.test(f.filename))); 
  if (touchedDeps && !/DEPENDENCY_CHANGE:\s*YES/i.test(body)) { 
    die(`تم تغيير ملفات التبعية دون نية معلنة.\n` + 
        `أضف هذا السطر إلى وصف طلب السحب: DEPENDENCY_CHANGE: YES\n` + 
        `إذا لم يكن ذلك مقصودًا، فقم بإلغاء تغييرات التبعية.`);   
  } 
  
  ok("تم اجتياز فحوصات الحوكمة."); 
} 

main().catch((e) => die(e.stack || String(e)));
