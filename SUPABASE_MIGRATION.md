# Neon to Supabase Migration

This app uses Prisma with PostgreSQL. Supabase is PostgreSQL-compatible, so code changes are small:

- `DATABASE_URL` = Supabase pooled connection for app runtime.
- `DIRECT_URL` = Supabase direct connection for Prisma migrations.
- `SUPABASE_DIRECT_URL` = same direct URL, used by migration script.
- `NEON_DATABASE_URL` = old Neon database URL, used only during data copy.

## Free tier (default Supabase plan)

No paid add-on required. Same connection types as paid: **Shared pooler → Transaction** for `DATABASE_URL`, **Direct** or **Session pooler** for `DIRECT_URL`.

- **Idle pause:** inactive projects sleep; first request or opening the dashboard wakes DB. Cold start = normal.
- **Connection pressure:** append `?pgbouncer=true&connection_limit=1` on pooled `DATABASE_URL` so Prisma does not open many connections through PgBouncer (recommended for serverless + shared pooler).
- **IPv4:** free tier still gets **IPv4-compatible transaction pooler**; use that for app. If `db.<ref>.supabase.co` fails from laptop (IPv6-only host), set `DIRECT_URL` to **Session pooler** string from the dashboard for `prisma migrate` / `pg_restore`.
- **Dedicated DB user (step 3 below):** optional on free tier; skip unless you want least-privilege separation.

## 1. Create Supabase project

In Supabase dashboard:

1. Create project.
2. Go to **Project Settings -> Database**.
3. Optional but recommended: create a dedicated `prisma` database user in SQL Editor and use that user in connection strings.
4. Copy **Connection string -> Transaction pooler** for serverless app runtime.
5. Copy **Connection string -> Direct connection** for migrations and restore. If direct IPv6 cannot connect from your machine/host, use the **Session pooler** string for `DIRECT_URL`.

Use the same database password in both URLs.

## 2. Set local migration env

Create temporary local values. Do not commit real credentials.

```bash
export NEON_DATABASE_URL="postgresql://..."
export SUPABASE_DATABASE_URL="postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
export SUPABASE_DIRECT_URL="postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres"
```

For app env:

```env
DATABASE_URL="postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres"
```

## 3. Backup Neon

```bash
npm run db:migrate:neon-to-supabase
```

This creates `backups/neon-YYYYMMDDHHMMSS.dump` and prints the restore command.

## 4. Restore into Supabase

For a new empty Supabase database:

```bash
pg_restore --verbose --clean --if-exists --no-owner --no-privileges --dbname="$SUPABASE_DIRECT_URL" backups/neon-YYYYMMDDHHMMSS.dump
```

If restore fails because Supabase system schemas/extensions already exist, keep only app schema restore:

```bash
pg_restore --verbose --clean --if-exists --no-owner --no-privileges --schema=public --dbname="$SUPABASE_DIRECT_URL" backups/neon-YYYYMMDDHHMMSS.dump
```

## 5. Verify Prisma

```bash
DIRECT_URL="$SUPABASE_DIRECT_URL" DATABASE_URL="$SUPABASE_DATABASE_URL" npx prisma migrate status
DIRECT_URL="$SUPABASE_DIRECT_URL" DATABASE_URL="$SUPABASE_DATABASE_URL" npx prisma validate
DIRECT_URL="$SUPABASE_DIRECT_URL" DATABASE_URL="$SUPABASE_DATABASE_URL" npx prisma generate
```

Expected: migrations applied, schema valid.

## 6. Configure deployment

Set these in Vercel/hosting provider:

```env
DATABASE_URL="Supabase transaction pooler URL"
DIRECT_URL="Supabase direct connection URL"
NEXTAUTH_URL="https://your-production-domain"
APP_URL="https://your-production-domain"
NEXT_PUBLIC_SOCKET_URL="https://your-production-domain"
```

Keep existing auth/email/storage secrets unchanged unless provider changes.

## 7. Final cutover

1. Put app in maintenance mode or stop writes.
2. Run backup + restore again for final fresh data.
3. Update production env from Neon URL to Supabase URLs.
4. Deploy.
5. Run smoke tests: signup/login, create hackathon, register team, submit project, judge score.
6. Keep Neon project read-only/active for a few days as rollback.

## Troubleshooting

- **`Can't reach database server` / `NXDOMAIN` on `db.<ref>.supabase.co`:** Project ref or hostname wrong. In Supabase dashboard → **Project Settings → Database**, copy fresh URI strings; old projects show a different ref after restore or recreate.
- **Free tier project paused:** Dashboard shows “Paused”; click **Restore** / open project. Until resumed, app gets connection errors.
- **`npm run seed` fails with P2024 / connection pool:** Pooled `DATABASE_URL` uses `connection_limit=1`; seed script runs parallel `Promise.all`. Repo `seed` npm script temporarily sets `DATABASE_URL=$DIRECT_URL` for the seed process only.
- **Restore vs `db:copy:neon-to-supabase`:** `pg_restore` from Neon dump = full clone including constraints. Node copy script needs empty tables (run `prisma migrate deploy` on Supabase first) and correct insert order; duplicates → errors.

## References

- Supabase Prisma guide: https://supabase.com/docs/guides/database/prisma
- Supabase connection guide: https://supabase.com/docs/guides/database/connecting-to-postgres
- Prisma Supabase guide: https://www.prisma.io/docs/orm/v6/overview/databases/supabase
- Prisma PgBouncer guide: https://www.prisma.io/docs/guides/performance-and-optimization/connection-management/configure-pg-bouncer
