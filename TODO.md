# Hackmate2 Feature: Organiser Mentor/Judge Invites, Auto-Assign, Team Chat

## Approved Plan Breakdown (Step-by-step)

### Phase 1: Database Schema Updates
- [x] 1.1 Add `StaffInvite`, `TeamMentor`, `ChatMessage` models to `prisma/schema.prisma`
- [ ] 1.2 Run `npx prisma generate` and `npx prisma db push` (or migrate)

### Phase 2: Backend APIs & Email
- [x] 2.1 Extend `src/lib/email.ts`: Add `sendMentorJudgeInvite(email, hackathonTitle, role, acceptUrl)`
- [x] 2.2 Create `src/app/api/hackathons/[hackathonId]/staff/invite/route.ts` (POST: create invite record, generate token, send email)
- [x] 2.3 Create `src/app/api/hackathons/[hackathonId]/staff/auto-assign/route.ts` (POST: assign mentors to unassigned teams)
- [x] 2.4 Added accept-staff-invite route/page (handles token validation, redirects to signup with params)

### Phase 3: Chat Backend
- [ ] 3.1 Create `src/app/api/hackathons/[hackathonId]/chat/[teamId]/route.ts` (GET/POST messages)
- [ ] 3.2 Extend `src/lib/socket.ts` for real-time chat (team-mentor rooms)

### Phase 4: Frontend Components & Pages
- [ ] 4.1 Update `src/components/organiser/StaffManagement.tsx`: Fix API calls, add "Send Invite Email", "Auto-Assign Mentors" buttons
- [ ] 4.2 Create command center integration if page exists, else new `src/app/organiser/command-center/[hackathonId]/page.tsx`
- [ ] 4.3 Create `src/app/participant/hackathons/[hackathonId]/mentor-chat/page.tsx` (team chat UI)
- [ ] 4.4 Create `src/app/mentor/hackathons/[hackathonId]/team-chat/[teamId]/page.tsx` (mentor chat UI)

### Phase 5: Testing & Integration
- [ ] 5.1 Update types (`src/types/index.ts`) if needed
- [ ] 5.2 Test APIs (invites, assign, chat)
- [ ] 5.3 Verify email flow
- [ ] 5.4 Update dashboards with links
- [ ] 5.5 Full e2e test

**Current Progress:** Starting Phase 1

**Next Step:** Schema changes
