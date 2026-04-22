# Hackmate Setup Guide - Database Configuration

## Option 1: Cloud PostgreSQL (Fastest - Recommended for Now)

### Using Neon (Free Tier Available)
1. Go to https://neon.tech
2. Sign up for free account
3. Create new project
4. Copy the connection string
5. Update `.env.local`:
   ```
   DATABASE_URL="<your-neon-connection-string>"
   ```
6. Run migrations: `npm run prisma:migrate:dev`

### Using Supabase (Free Tier Available)
1. Go to https://supabase.com
2. Create new project
3. Go to Settings → Database
4. Copy the connection string
5. Update `.env.local`:
   ```
   DATABASE_URL="<your-supabase-connection-string>"
   ```
6. Run migrations: `npm run prisma:migrate:dev`

---

## Option 2: Local PostgreSQL

### Windows Installation

**Method A: PostgreSQL Installer (Easiest)**
1. Download from https://www.postgresql.org/download/windows/
2. Run installer
3. Note the password you set for `postgres` user
4. Update `.env.local`:
   ```
   DATABASE_URL="postgresql://postgres:<password>@localhost:5432/hackmate"
   ```
5. Run migrations: `npm run prisma:migrate:dev`

**Method B: Docker (If you have Docker installed)**
```powershell
docker run --name hackmate-postgres `
  -e POSTGRES_USER=postgres `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=hackmate `
  -p 5432:5432 `
  -d postgres:15
```

Then update `.env.local`:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/hackmate"
```

---

## Quick Start (Using Neon)

If you want to get running immediately:

1. **Create Neon account** (2 minutes)
   - Visit https://neon.tech
   - Sign up (free tier: $0)
   - Create project

2. **Get connection string**
   - In Neon dashboard, find connection string
   - Click "Connection string" tab
   - Copy the full connection string

3. **Update .env.local**
   ```
   # Replace <CONNECTION_STRING> with your Neon connection
   DATABASE_URL="<CONNECTION_STRING>"
   ```

4. **Run migrations**
   ```bash
   npm run prisma:migrate:dev
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. Visit http://localhost:3000

---

## Test Database Connection

After setting DATABASE_URL, test the connection:

```bash
# View schema in Prisma Studio
npm run prisma:studio
```

This should open http://localhost:5555 and show your database schema.

---

## Common Issues

### "Cannot connect to database"
- Verify DATABASE_URL in .env.local
- Check if PostgreSQL/cloud service is running
- Verify credentials are correct

### "Migrations failed"
- Ensure database exists
- Check DATABASE_URL syntax
- Try: `npm run prisma:migrate:reset` (dev only)

### "Port 5432 already in use"
- PostgreSQL already running
- Use: `netstat -ano | findstr :5432` to find process
- Or specify different port in DATABASE_URL

---

## Next Steps After Database Setup

1. Run migrations:
   ```bash
   npm run prisma:migrate:dev
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Open http://localhost:3000

4. Configure OAuth:
   - GitHub: https://github.com/settings/developers
   - Google: https://console.cloud.google.com/

5. Update .env.local with OAuth credentials

---

**Choose your preferred option and let me know when you're ready to proceed!**
