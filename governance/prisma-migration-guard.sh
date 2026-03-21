#!/usr/bin/env bash 
set -euo pipefail 
echo "[PRISMA GUARD] التحقق من اتساق المخطط/الترحيلات..." 

SCHEMA_CHANGED=$(git diff --name-only origin/${GITHUB_BASE_REF}...HEAD | grep -E '^prisma/schema\.prisma$' || true) 
MIGRATIONS_CHANGED=$(git diff --name-only origin/${GITHUB_BASE_REF}...HEAD | grep -E '^prisma/migrations/' || true) 

if [[ -n "$SCHEMA_CHANGED" && -z "$MIGRATIONS_CHANGED" ]]; then 
  echo "[PRISMA GUARD] ❌ تم تغيير schema.prisma بدون ترحيلات." 
  echo "تشغيل: npx prisma migrate dev --name <meaningful_name>" 
  exit 1 
fi 

echo "[PRISMA GUARD] ✅ OK" 
