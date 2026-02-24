/**
 * fix-prisma-imports.js
 * 
 * Replaces `new PrismaClient()` in every agent file with the shared singleton.
 * This fixes the SQLite P1008 concurrency timeouts caused by 20+ DB connections.
 * 
 * Run: node fix-prisma-imports.js
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const agentsDir = path.join(__dirname, 'src', 'lib', 'orchestrator', 'agents');
const files = fs.readdirSync(agentsDir).filter(f => f.endsWith('.ts'));

let fixed = 0;

for (const filename of files) {
  const filepath = path.join(agentsDir, filename);
  let content = fs.readFileSync(filepath, 'utf-8');
  const original = content;

  // Remove the individual PrismaClient import line
  content = content.replace(/import \{ PrismaClient \} from ["']@prisma\/client["'];\r?\n/g, '');

  // Replace local instantiation with the shared singleton import
  content = content.replace(/const prisma = new PrismaClient\(\);\r?\n/g, 'import prisma from "../prisma";\n');

  if (content !== original) {
    fs.writeFileSync(filepath, content, 'utf-8');
    console.log(`✅ Fixed: ${filename}`);
    fixed++;
  } else {
    console.log(`⏭️  Skipped (already clean): ${filename}`);
  }
}

console.log(`\n🎉 Done! Fixed ${fixed} of ${files.length} agent files.`);
