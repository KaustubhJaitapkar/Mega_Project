#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${NEON_DATABASE_URL:-}" ]]; then
  echo "Missing NEON_DATABASE_URL"
  exit 1
fi

if [[ -z "${SUPABASE_DIRECT_URL:-}" ]]; then
  echo "Missing SUPABASE_DIRECT_URL"
  exit 1
fi

if ! command -v pg_dump >/dev/null 2>&1; then
  echo "Missing pg_dump. Install PostgreSQL client tools."
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "Missing psql. Install PostgreSQL client tools."
  exit 1
fi

backup_dir="${BACKUP_DIR:-./backups}"
timestamp="$(date +%Y%m%d%H%M%S)"
dump_file="${backup_dir}/neon-${timestamp}.dump"

mkdir -p "$backup_dir"

echo "Creating Neon backup: ${dump_file}"
pg_dump "$NEON_DATABASE_URL" \
  --format=custom \
  --verbose \
  --no-owner \
  --no-privileges \
  --file="$dump_file"

echo "Checking Supabase connection"
psql "$SUPABASE_DIRECT_URL" -v ON_ERROR_STOP=1 -c "select current_database(), current_user;"

cat <<EOF

Backup complete.

Restore command:
  pg_restore --verbose --clean --if-exists --no-owner --no-privileges --dbname="\$SUPABASE_DIRECT_URL" "$dump_file"

After restore:
  DIRECT_URL="\$SUPABASE_DIRECT_URL" DATABASE_URL="\$SUPABASE_DATABASE_URL" npx prisma migrate status
  DIRECT_URL="\$SUPABASE_DIRECT_URL" DATABASE_URL="\$SUPABASE_DATABASE_URL" npx prisma generate
EOF
