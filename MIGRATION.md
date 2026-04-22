# Hackmate Migration & Deployment Guide

## Initial Setup

### 1. Database Migration

Run this once to initialize the database:

```bash
# Generate Prisma Client
npm run prisma:generate

# Create initial migration
npm run prisma:migrate:dev

# Follow prompts to name migration (e.g., "init")
```

This creates:
- All database tables
- Indexes
- Constraints
- Relations

### 2. Production Deployment

For production, use:

```bash
npm run prisma:migrate:prod
```

This runs all pending migrations without interactive prompts.

## Database Schema Overview

### User Management
```sql
-- Users with roles
CREATE TABLE "User" (
  id SERIAL PRIMARY KEY,
  email UNIQUE,
  password,
  name,
  role ENUM (PARTICIPANT, ORGANISER, JUDGE, MENTOR, SPONSOR),
  createdAt TIMESTAMP
);

-- User profiles
CREATE TABLE "Profile" (
  id SERIAL PRIMARY KEY,
  userId UNIQUE,
  bio TEXT,
  skills ARRAY,
  experience ENUM (junior, mid, senior),
  company VARCHAR,
  website VARCHAR
);
```

### Hackathon Management
```sql
-- Hackathons
CREATE TABLE "Hackathon" (
  id SERIAL PRIMARY KEY,
  title VARCHAR,
  description TEXT,
  status ENUM (DRAFT, REGISTRATION, ONGOING, ENDED, CANCELLED),
  startDate TIMESTAMP,
  endDate TIMESTAMP,
  registrationDeadline TIMESTAMP,
  submissionDeadline TIMESTAMP,
  maxTeamSize INT,
  minTeamSize INT,
  organiserId FOREIGN KEY,
  createdAt TIMESTAMP
);

-- Teams within hackathons
CREATE TABLE "Team" (
  id SERIAL PRIMARY KEY,
  hackathonId FOREIGN KEY,
  name VARCHAR,
  creatorId FOREIGN KEY,
  status ENUM (FORMING, COMPLETE, DISBANDED),
  maxMembers INT,
  isOpen BOOLEAN
);

-- Team membership
CREATE TABLE "TeamMember" (
  id SERIAL PRIMARY KEY,
  teamId FOREIGN KEY,
  userId FOREIGN KEY,
  role VARCHAR (leader, member),
  joinedAt TIMESTAMP,
  UNIQUE (teamId, userId)
);

-- Join requests
CREATE TABLE "JoinRequest" (
  id SERIAL PRIMARY KEY,
  teamId FOREIGN KEY,
  userId FOREIGN KEY,
  status ENUM (PENDING, ACCEPTED, REJECTED),
  createdAt TIMESTAMP,
  UNIQUE (teamId, userId)
);
```

### Submissions & Judging
```sql
-- Project submissions
CREATE TABLE "Submission" (
  id SERIAL PRIMARY KEY,
  hackathonId FOREIGN KEY,
  teamId UNIQUE FOREIGN KEY,
  githubUrl VARCHAR,
  liveUrl VARCHAR,
  status ENUM (NOT_SUBMITTED, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED),
  isHealthy BOOLEAN,
  healthCheckAt TIMESTAMP,
  submittedAt TIMESTAMP
);

-- Scoring rubrics
CREATE TABLE "Rubric" (
  id SERIAL PRIMARY KEY,
  hackathonId FOREIGN KEY,
  name VARCHAR,
  maxScore FLOAT,
  isActive BOOLEAN
);

-- Rubric items
CREATE TABLE "RubricItem" (
  id SERIAL PRIMARY KEY,
  rubricId FOREIGN KEY,
  name VARCHAR,
  weight FLOAT,
  maxScore FLOAT,
  order INT
);

-- Scores
CREATE TABLE "Score" (
  id SERIAL PRIMARY KEY,
  submissionId FOREIGN KEY,
  rubricItemId FOREIGN KEY,
  judgerId FOREIGN KEY,
  score FLOAT,
  comment TEXT,
  isSealed BOOLEAN,
  UNIQUE (submissionId, rubricItemId, judgerId)
);
```

### Support System
```sql
-- Help tickets
CREATE TABLE "HelpTicket" (
  id SERIAL PRIMARY KEY,
  hackathonId FOREIGN KEY,
  creatorId FOREIGN KEY,
  assignedToId FOREIGN KEY (nullable),
  title VARCHAR,
  description TEXT,
  status ENUM (OPEN, IN_PROGRESS, RESOLVED, CLOSED),
  priority VARCHAR (low, normal, high),
  category VARCHAR (technical, general, judging),
  createdAt TIMESTAMP
);

-- Announcements
CREATE TABLE "Announcement" (
  id SERIAL PRIMARY KEY,
  hackathonId FOREIGN KEY,
  authorId FOREIGN KEY,
  title VARCHAR,
  content TEXT,
  isUrgent BOOLEAN,
  createdAt TIMESTAMP
);
```

## Common Database Operations

### View Current Schema
```bash
npm run prisma:studio
```

Opens Prisma Studio at `http://localhost:5555`

### Create New Model
1. Update `prisma/schema.prisma`
2. Run: `npm run prisma:migrate:dev`
3. Name the migration descriptively

### Seed Database

Create `prisma/seed.ts`:
```typescript
import { prisma } from '../src/lib/prisma';

async function main() {
  // Create test users, hackathons, etc.
  const user = await prisma.user.create({
    data: {
      email: 'test@example.com',
      name: 'Test User',
      role: 'ORGANISER',
    },
  });
  
  console.log('Seeded:', user);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
```

Run seed:
```bash
npx prisma db seed
```

### Reset Database (Development Only)
```bash
npx prisma migrate reset
```

## Backup & Recovery

### Backup PostgreSQL

```bash
# Full backup
pg_dump hackmate > backup-$(date +%Y%m%d).sql

# Compressed backup
pg_dump hackmate | gzip > backup-$(date +%Y%m%d).sql.gz

# Backup specific table
pg_dump hackmate -t "User" > users-backup.sql
```

### Restore from Backup

```bash
# Full restore
psql hackmate < backup.sql

# Compressed restore
gunzip -c backup.sql.gz | psql hackmate

# Restore specific table
psql hackmate < users-backup.sql
```

## Indexes for Performance

Automatically created indexes:
- User email (unique)
- User role
- Hackathon status
- Hackathon start date
- Team hackathon ID
- Submission hackathon ID & status
- HelpTicket hackathon ID & status
- Announcement creation date

### Adding Custom Indexes

```prisma
model User {
  id String @id @default(cuid())
  email String @unique
  role UserRole
  
  @@index([email])      // Search optimization
  @@index([role])       // Filter by role
}
```

## Connection Pooling (Production)

For Vercel/serverless, use PgBouncer:

```env
# Use connection pool
DATABASE_URL="postgresql://user:password@pgbouncer-host:6432/hackmate?schema=public"
```

Update Prisma:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DATABASE_DIRECT_URL")  // Direct connection for migrations
}
```

## Monitoring & Health Checks

### Check Database Connection

```bash
psql $DATABASE_URL -c "SELECT 1"
```

### Monitor Large Tables

```sql
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Check Query Performance

Enable Prisma query logging:

```typescript
// lib/prisma.ts
const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});
```

## Troubleshooting

### Foreign Key Violations
```bash
# Check constraints
psql hackmate -c "SELECT * FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY';"

# Disable temporarily
ALTER TABLE submission DISABLE TRIGGER ALL;
ALTER TABLE submission ENABLE TRIGGER ALL;
```

### Corruption Issues
```bash
# Analyze and reindex
VACUUM ANALYZE;
REINDEX DATABASE hackmate;
```

### Slow Queries
```bash
# Enable query logging
ALTER SYSTEM SET log_min_duration_statement = 1000;  -- 1 second
SELECT pg_reload_conf();
```

## Prisma CLI Commands

```bash
# Generate Prisma Client
npx prisma generate

# View database in UI
npx prisma studio

# Format schema
npx prisma format

# Validate schema
npx prisma validate

# Create migration
npx prisma migrate dev --name <name>

# Review pending migrations
npx prisma migrate status

# Deploy migrations
npx prisma migrate deploy

# Reset database (dev only)
npx migrate reset

# View seed script execution
npx prisma db seed
```

## Environment-Specific Configurations

### Development
```env
DATABASE_URL="postgresql://localhost/hackmate"
NODE_ENV="development"
DEBUG="*"
```

### Staging
```env
DATABASE_URL="postgresql://user:pass@staging-db:5432/hackmate"
NODE_ENV="production"
DEBUG=""
```

### Production
```env
DATABASE_URL="postgresql://user:pass@prod-db.aws.com:5432/hackmate"
DATABASE_DIRECT_URL="postgresql://user:pass@prod-db-direct.aws.com:5432/hackmate"
NODE_ENV="production"
DEBUG=""
```

---

See [README.md](./README.md) for complete documentation.
