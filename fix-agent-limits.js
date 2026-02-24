/**
 * fix-agent-limits.js
 * Reduces per-cycle AI file count in each agent to 2 files.
 * Free tier: 1500 RPD. 42 calls/cycle = ~35 cycles/day (3h).
 * With 2 files each: 16 calls/cycle = ~93 cycles/day (8+ hours).
 */
const fs = require('fs');
const path = require('path');

const agentsDir = path.join(__dirname, 'src', 'lib', 'orchestrator', 'agents');

// Which files to update and what their current vs desired limits are
const targets = [
  { file: 'code-review-agent.ts',  from: '.slice(0, 5)',  to: '.slice(0, 2)' },
  { file: 'ai-review-agent.ts',    from: '.slice(0, 5)',  to: '.slice(0, 2)' },
  { file: 'api-agent.ts',          from: '.slice(0, 6)',  to: '.slice(0, 2)' },
  { file: 'backend-agent.ts',      from: '.slice(0, 5)',  to: '.slice(0, 2)' },
  { file: 'dashboard-agent.ts',    from: '.slice(0, 4)',  to: '.slice(0, 2)' },
  { file: 'frontend-agent.ts',     from: '.slice(0, 4)',  to: '.slice(0, 2)' },
  { file: 'uiux-agent.ts',         from: '.slice(0, 5)',  to: '.slice(0, 2)' },
  // qa-agent is already at 3, bring to 2
  { file: 'qa-agent.ts',           from: '.slice(0, 3)',  to: '.slice(0, 2)' },
];

let totalFixed = 0;

for (const { file, from, to } of targets) {
  const filepath = path.join(agentsDir, file);
  if (!fs.existsSync(filepath)) {
    console.log(`⏭️  Not found: ${file}`);
    continue;
  }
  let content = fs.readFileSync(filepath, 'utf-8');
  const original = content;

  // Only replace the FIRST occurrence (the file-list slice, not content slices)
  content = content.replace(from, to);

  if (content !== original) {
    fs.writeFileSync(filepath, content, 'utf-8');
    console.log(`✅ ${file}: changed ${from} → ${to}`);
    totalFixed++;
  } else {
    console.log(`⏭️  ${file}: pattern not found, skipping.`);
  }
}

console.log(`\n🎉 Done! Updated ${totalFixed}/${targets.length} agents.`);
console.log(`📊 Estimated API calls per cycle: ~${totalFixed * 2 + 4} calls`);
console.log(`⏱️  Cycle time: ~${((totalFixed * 2 + 4) * 4)}s`);
console.log(`📅 Daily capacity: ~${Math.floor(1500 / (totalFixed * 2 + 4))} cycles/day`);
