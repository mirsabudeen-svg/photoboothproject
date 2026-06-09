#!/usr/bin/env bash
set -euo pipefail

REQUIRED=(DATABASE_URL REDIS_URL PAIRING_CODE R2_BUCKET TWILIO_ACCOUNT_SID ADMIN_API_KEY)

echo "Environment check"
for var in "${REQUIRED[@]}"; do
  if [[ -z "${!var:-}" ]]; then
    echo "❌ Missing: $var"
  else
    echo "✅ Set: $var"
  fi
done
