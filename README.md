# Hackmate2

An impact-focused hackathon project built for real users, designed for clear demos, strong judging scores, and production-ready growth.

## Problem

Describe the exact pain point your users face in 2-3 lines.

Example:
- Who is affected?
- What is broken today?
- Why current solutions are insufficient?

## Solution

Hackmate2 solves this by:
- `Feature 1`: Core workflow that directly addresses the pain point.
- `Feature 2`: Smart automation or intelligence layer.
- `Feature 3`: User-facing polish that improves adoption.

## Key Features

- Working MVP with end-to-end flow
- Clean and simple user experience
- Scalable architecture ready for iteration
- Clear measurable impact

## Tech Stack

- Frontend: `<add frontend stack>`
- Backend: `<add backend stack>`
- Database: `<add db>`
- AI/ML (optional): `<add model/service>`
- Deployment: `<add hosting>`

## Architecture

1. User action starts from the client app.
2. API layer validates and routes requests.
3. Core service processes business logic.
4. Data and analytics are stored for insights.

## Demo

- Video demo: `<youtube/vimeo link>`
- Live demo: `<public app link>`
- Source code: `<repo link>`

## Installation

```bash
# clone
git clone <repo-url>
cd <project-folder>

# install
<install-command>

# run
<start-command>
```

## Usage

1. Open the app.
2. Complete the primary user journey.
3. Verify expected output and impact.

## Impact

- Target users: `<persona>`
- Expected outcome: `<time saved / cost reduced / reach improved>`
- Why this matters now: `<1 line>`

## What Makes It Different

- Novel approach compared to existing alternatives
- Better usability and faster onboarding
- Practical implementation over just concept

## Roadmap

- [ ] Add advanced analytics dashboard
- [ ] Improve performance and reliability
- [ ] Add authentication and role-based access
- [ ] Expand integrations

## Team

- `<Name>` - `<Role>`
- `<Name>` - `<Role>`

## License

MIT
# Hackmate - Production-Grade Hackathon Platform

A complete, production-ready hackathon management platform built with Next.js 14, Prisma, and modern web technologies.

## Features

### 🔐 Authentication
- Multiple auth methods: GitHub, Google, Email magic link, and credentials
- JWT-based sessions
- Role-based access control (Participant, Organizer, Judge, Mentor, Sponsor)

### 👤 User Management
- Comprehensive profile system with skills, experience, and social links
- Public/private profile settings
- User verification and email confirmation

### 🏆 Hackathon Management (Organizers)
- Full event lifecycle management (DRAFT → REGISTRATION → ONGOING → ENDED)
- Team size configuration
- Deadline management
- Event timeline creation
- Prize pool definition
- Rule creation and management

### 👥 Team System
- Create and join teams
- Team member management
- Join requests with accept/reject flow
- Team leader designation
- Skill-based team recommendations

### 📝 Submission System
- GitHub repository submission
- Live project URL submission
- Health check validation
- Async submission validation
- Multiple technology tagging

### ⭐ Judging System
- Drag-drop rubric builder
- Customizable scoring criteria
- Weighted scoring
- Score sealing for fairness
- Real-time score updates

### 📢 Real-time Features (Socket.io)
- Live announcements with urgent flag
- Help ticket real-time updates
- Join request notifications
- Dashboard live statistics

### 🎫 Help Desk System
- Categorized help tickets (technical, general, judging)
- Priority levels
- Mentor assignment
- Ticket status tracking
- Real-time updates

### 🏅 Certificates
- Automatic PDF certificate generation
- Multiple certificate types (Participant, Winner, Runner-up, Best Project)
- Server-side generation
- URL storage in database

### 📊 Analytics & Command Center
- Live statistics dashboard
- Team and submission tracking
- Attendance monitoring
- Score analysis
- Announcement management

## Tech Stack

### Frontend & Backend
- **Next.js 14** - App Router, TypeScript
- **React 18** - UI library
- **Tailwind CSS** - Styling

### Database
- **PostgreSQL** - Relational database
- **Prisma ORM** - Database management
- **Prisma Client** - Type-safe DB access

### Authentication
- **NextAuth.js 4.24** - Session & authentication
- **JWT** - Token-based auth
- **OAuth 2.0** - Provider integrations

### Real-time Communication
- **Socket.io** - WebSocket communication

### Additional Libraries
- **Zod** - Data validation
- **bcryptjs** - Password hashing
- **nodemailer** - Email sending
- **pdfkit** - PDF generation
- **date-fns** - Date manipulation
- **Zustand** - State management
- **React Toastify** - Notifications

### Testing
- **Playwright** - End-to-end testing

## Project Structure

```
src/
├── app/
│   ├── (auth)/                 # Authentication pages (login, signup)
│   ├── (participant)/          # Participant dashboard & views
│   ├── (organiser)/            # Organizer command center
│   ├── (judge)/                # Judge scoring interface
│   ├── api/                    # Route handlers & API
│   │   ├── auth/              # Auth API routes
│   │   ├── users/             # User management
│   │   ├── hackathons/        # Hackathon CRUD & related
│   │   ├── teams/             # Team management
│   │   ├── submissions/       # Submission handling
│   │   └── ...
│   ├── layout.tsx             # Root layout
│   └── globals.css            # Global styles
├── components/
│   ├── Sidebar.tsx
│   ├── Header.tsx
│   ├── HackathonCard.tsx
│   ├── TeamCard.tsx
│   ├── HackathonForm.tsx
│   └── ...
├── lib/
│   ├── prisma.ts              # Prisma client singleton
│   ├── auth.ts                # NextAuth configuration
│   ├── email.ts               # Email templates
│   ├── validation.ts          # Zod schemas
│   ├── middleware.ts          # Auth middleware
│   ├── socket.ts              # Socket.io setup
│   ├── certificate.ts         # PDF generation
│   └── submission.ts          # Submission validation
├── types/
│   └── index.ts               # TypeScript types
├── hooks/
│   └── ...                    # Custom React hooks
├── stores/
│   └── ...                    # Zustand stores
└── prisma/
    └── schema.prisma          # Database schema

prisma/
└── migrations/                # Database migrations
```

## Database Schema

### Core Models
- **User** - User accounts with roles and authentication
- **Profile** - User profile information
- **Hackathon** - Event management
- **Team** - Team formation and management
- **TeamMember** - Team membership
- **Submission** - Project submissions
- **JoinRequest** - Team join requests

### Judging Models
- **Rubric** - Evaluation criteria
- **RubricItem** - Individual scoring items
- **Score** - Judge scores

### Support Models
- **HelpTicket** - Support tickets
- **Announcement** - Event announcements
- **Attendance** - Event attendance tracking
- **Certificate** - Certificate generation
- **Timeline** - Event timeline

## Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### 1. Clone & Install

```bash
git clone <repo-url>
cd hackmate
npm install
```

### 2. Environment Setup

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your configuration:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/hackmate"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-min-32-char-secret-key"

# OAuth Providers
GITHUB_ID="your-github-app-id"
GITHUB_SECRET="your-github-app-secret"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
EMAIL_FROM="noreply@hackmate.com"

# Optional: Redis for sessions
REDIS_URL="redis://localhost:6379"
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate:dev

# Optional: Seed database
npx prisma db seed
```

### 4. GitHub OAuth Setup

1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Create new OAuth App
3. Set Authorization callback URL to: `http://localhost:3000/api/auth/callback/github`
4. Copy Client ID and Secret to `.env.local`

### 5. Google OAuth Setup

1. Go to Google Cloud Console
2. Create OAuth 2.0 credentials (Desktop app)
3. Set authorized redirect URI to: `http://localhost:3000/api/auth/callback/google`
4. Copy credentials to `.env.local`

### 6. Email Setup

For Gmail:
1. Enable 2-step verification
2. Generate App Password
3. Use App Password in SMTP_PASSWORD

### 7. Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

## Running Tests

```bash
# Run Playwright tests
npm test

# Run with UI
npm run test:ui

# Debug mode
npm run test:debug
```

## API Documentation

### Authentication Endpoints
- `POST /api/auth/[...nextauth]` - NextAuth handler
- `POST /api/auth/signup` - Create account
- `GET/PUT /api/users/profile` - Profile management

### Hackathon Endpoints
- `GET /api/hackathons` - List all hackathons
- `POST /api/hackathons` - Create hackathon
- `GET /api/hackathons/:id` - Get hackathon details
- `PUT /api/hackathons/:id` - Update hackathon
- `DELETE /api/hackathons/:id` - Delete hackathon
- `GET /api/hackathons/:id/stats` - Get statistics

### Team Endpoints
- `GET /api/hackathons/:hackathonId/teams` - List teams
- `POST /api/hackathons/:hackathonId/teams` - Create team
- `GET /api/teams/:teamId` - Get team details
- `POST /api/teams/:teamId/join` - Join team
- `POST/DELETE /api/teams/:teamId/requests/:requestId` - Handle join requests

### Submission Endpoints
- `GET/POST /api/submissions/:teamId` - Get/create submission
- `GET/POST /api/submissions/:submissionId/scores` - Score submissions

### Support Endpoints
- `GET/POST /api/hackathons/:hackathonId/tickets` - Manage tickets
- `GET/POST /api/hackathons/:hackathonId/announcements` - Manage announcements
- `GET/POST /api/hackathons/:hackathonId/rubrics` - Manage scoring rubrics
- `GET/POST /api/hackathons/:hackathonId/certificates` - Generate certificates

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables for Production
- Use strong NEXTAUTH_SECRET
- Set NODE_ENV=production
- Use production database URL
- Set NEXTAUTH_URL to your domain
- Configure OAuth redirect URLs properly

## Performance Optimizations

- Image optimization with Next.js Image
- API route caching
- Database query optimization with Prisma
- Real-time updates via Socket.io
- Client-side caching with Zustand

## Security Considerations

- JWT token expiration
- CSRF protection via NextAuth
- Password hashing with bcrypt
- SQL injection prevention via Prisma
- XSS protection via React
- Rate limiting recommended
- HTTPS in production
- Secure cookies with sameSite policy

## Maintenance

### Database Backups
```bash
pg_dump hackmate > backup.sql
```

### View Database
```bash
npm run prisma:studio
```

### Clear Data
```bash
npx prisma db push --skip-generate
npx prisma migrate reset
```

## Troubleshooting

### Port Already in Use
```bash
lsof -i :3000
kill -9 <PID>
```

### Database Connection Issues
- Check DATABASE_URL
- Ensure PostgreSQL is running
- Verify credentials
- Check firewall/network settings

### OAuth Failures
- Verify callback URLs match exactly
- Check that OAuth apps are activated
- Ensure credentials are correctly set

### Email Not Sending
- Verify SMTP credentials
- Check Gmail security settings
- Ensure "Less secure apps" is enabled (if using Gmail)
- Check email logs in production

## Contributing

1. Create feature branch
2. Make changes
3. Run tests: `npm test`
4. Submit PR

## License

MIT License - See LICENSE file

## Support

For issues and questions:
- GitHub Issues
- Email: support@hackmate.com
- Documentation: Full inline code comments

---

**Built with ❤️ for hackers, by hackers.**
