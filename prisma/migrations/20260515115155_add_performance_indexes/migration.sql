-- CreateIndex
CREATE INDEX "Attendance_userId_idx" ON "Attendance"("userId");

-- CreateIndex
CREATE INDEX "Certificate_hackathonId_userId_type_idx" ON "Certificate"("hackathonId", "userId", "type");

-- CreateIndex
CREATE INDEX "Hackathon_organiserId_status_idx" ON "Hackathon"("organiserId", "status");

-- CreateIndex
CREATE INDEX "HackathonRegistration_hackathonId_selectedTrack_idx" ON "HackathonRegistration"("hackathonId", "selectedTrack");

-- CreateIndex
CREATE INDEX "HelpTicket_assignedToId_idx" ON "HelpTicket"("assignedToId");

-- CreateIndex
CREATE INDEX "HelpTicket_hackathonId_status_idx" ON "HelpTicket"("hackathonId", "status");

-- CreateIndex
CREATE INDEX "HelpTicket_hackathonId_createdAt_idx" ON "HelpTicket"("hackathonId", "createdAt");

-- CreateIndex
CREATE INDEX "Team_hackathonId_status_idx" ON "Team"("hackathonId", "status");

-- CreateIndex
CREATE INDEX "TeamMember_userId_teamId_idx" ON "TeamMember"("userId", "teamId");
