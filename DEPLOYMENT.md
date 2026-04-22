# Production Deployment Checklist

## Pre-Deployment

- [ ] All tests passing: `npm test`
- [ ] No TypeScript errors: `npm run build`
- [ ] Environment variables set for production
- [ ] Database backups taken
- [ ] SSL certificates configured
- [ ] CDN setup (optional)

## Environment Setup

### Required Environment Variables

```env
# Core
NODE_ENV=production
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=<generate-strong-32-char-secret>

# Database
DATABASE_URL=postgresql://user:pass@prod-db:5432/hackmate
DATABASE_DIRECT_URL=postgresql://user:pass@prod-db-direct:5432/hackmate

# OAuth
GITHUB_ID=<production-github-id>
GITHUB_SECRET=<production-github-secret>
GOOGLE_CLIENT_ID=<production-google-id>
GOOGLE_CLIENT_SECRET=<production-google-secret>

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<your-email>
SMTP_PASSWORD=<app-password>
EMAIL_FROM=noreply@hackmate.com

# Optional
REDIS_URL=redis://cache:6379
SENTRY_DSN=<error-tracking-dsn>
```

## Database Preparation

```bash
# On production database server
# 1. Create database
psql -U postgres -c "CREATE DATABASE hackmate;"

# 2. Create app user
psql -U postgres -c "CREATE USER hackmate_user WITH PASSWORD 'secure_password';"

# 3. Grant privileges
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE hackmate TO hackmate_user;"

# 4. Run migrations
npm run prisma:migrate:prod

# 5. Verify schema
npm run prisma:studio
```

## Vercel Deployment

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel --prod

# 4. Set environment variables in Vercel dashboard
# Or use:
vercel env add DATABASE_URL
vercel env add NEXTAUTH_SECRET
# ... add all env vars

# 5. Redeploy with env vars
vercel --prod
```

## Docker Deployment

### Build Docker Image

```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Build stage
FROM base AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN npm prune --production

# Runtime stage
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

Build and run:
```bash
docker build -t hackmate:latest .
docker run -p 3000:3000 -e DATABASE_URL="..." hackmate:latest
```

## AWS Deployment

### Using ECS + RDS

```bash
# 1. Create ECR repository
aws ecr create-repository --repository-name hackmate

# 2. Build and push
docker build -t hackmate:latest .
docker tag hackmate:latest <account>.dkr.ecr.<region>.amazonaws.com/hackmate:latest
docker push <account>.dkr.ecr.<region>.amazonaws.com/hackmate:latest

# 3. Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier hackmate-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username admin \
  --master-user-password <secure-password>

# 4. Create ECS cluster and service
# Use AWS Console or CLI to create task definition and service
```

## Health Checks

### Setup Liveness Probe

Add to `src/app/api/health/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    return NextResponse.json(
      { status: 'error' },
      { status: 500 }
    );
  }
}
```

Configure load balancer to hit `/api/health`

## Monitoring & Logging

### Setup Error Tracking (Sentry)

```bash
npm install @sentry/nextjs
```

```typescript
// next.config.js
import * as Sentry from "@sentry/nextjs";

export default withSentryConfig(nextConfig, {
  org: "your-org",
  project: "hackmate",
  authToken: process.env.SENTRY_AUTH_TOKEN,
});
```

### CloudWatch Logging

Set in `.env.production`:
```env
AWS_REGION=us-east-1
AWS_LOGS_GROUP=/hackmate
```

## SSL/TLS Certificates

### Using Let's Encrypt (Certbot)

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com
```

### Using AWS Certificate Manager

1. Request certificate in AWS Console
2. Validate domain ownership
3. Attach to ALB/CloudFront

## Performance Optimization

### Enable Caching

```nginx
# nginx.conf
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m;

location /api/ {
    proxy_cache api_cache;
    proxy_cache_valid 200 10m;
    proxy_cache_valid 404 1m;
    add_header X-Cache-Status $upstream_cache_status;
}
```

### Database Connection Pooling

```env
DATABASE_URL="postgresql://user:pass@pgbouncer:6432/hackmate?schema=public"
```

## Backup Strategy

### Automated Daily Backups

```bash
#!/bin/bash
# backup.sh
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)

pg_dump $DATABASE_URL | gzip > $BACKUP_DIR/hackmate_$DATE.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "hackmate_*.sql.gz" -mtime +30 -delete

# Upload to S3
aws s3 cp $BACKUP_DIR/hackmate_$DATE.sql.gz s3://backups/hackmate/
```

Schedule with cron:
```bash
0 2 * * * /path/to/backup.sh
```

## Security Hardening

- [ ] Enable HTTPS/TLS
- [ ] Set HSTS headers
- [ ] Configure CORS properly
- [ ] Rate limiting enabled
- [ ] SQL injection prevention (Prisma)
- [ ] XSS protection
- [ ] CSRF tokens
- [ ] Secure cookies (HttpOnly, SameSite)
- [ ] Regular security updates
- [ ] WAF rules configured
- [ ] DDoS protection enabled

### Security Headers

```typescript
// middleware.ts
import { NextResponse } from 'next/server';

export function middleware(request: Request) {
  const response = NextResponse.next();
  
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains'
  );
  
  return response;
}
```

## Post-Deployment

- [ ] Verify all APIs working
- [ ] Test authentication flows
- [ ] Monitor error rates
- [ ] Check database performance
- [ ] Verify email sending
- [ ] Test file uploads
- [ ] Monitor resource usage
- [ ] Setup alerts

## Rollback Plan

```bash
# If deployment fails, rollback to previous version
git revert <commit-hash>
npm run build
npm run prisma:migrate:prod
npm run start
```

## Support & Monitoring

- Set up uptime monitoring (StatusPage, Pingdom)
- Configure alerts for errors
- Setup performance monitoring (New Relic, DataDog)
- Document runbook for common issues
- Setup on-call rotation

---

For production support, contact: support@hackmate.com
