import {
  PrismaClient,
  UserRole,
  HackathonStatus,
  TeamStatus,
  SubmissionStatus,
  TicketStatus,
  CertificateType,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding comprehensive test data...\n");

  // Wipe existing data
  console.log("🧹 Cleaning existing data...");
  await prisma.score.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.teamMentor.deleteMany();
  await prisma.joinRequest.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.helpTicket.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  await prisma.timeline.deleteMany();
  await prisma.rubricItem.deleteMany();
  await prisma.rubric.deleteMany();
  await prisma.hackathonRegistration.deleteMany();
  await prisma.staffInvite.deleteMany();
  await prisma.hackathon.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  console.log("  Done.\n");

  const password = await bcrypt.hash("password123", 10);

  // ==================== USERS ====================
  console.log("👤 Creating users...");

  // 1 Organiser
  const organiser = await prisma.user.create({
    data: {
      email: "organiser@hackmate.dev",
      name: "Aria Sharma",
      role: UserRole.ORGANISER,
      password,
    },
  });

  // 2 Judges
  const judge1 = await prisma.user.create({
    data: {
      email: "judge1@hackmate.dev",
      name: "Raj Verma",
      role: UserRole.JUDGE,
      password,
    },
  });
  const judge2 = await prisma.user.create({
    data: {
      email: "judge2@hackmate.dev",
      name: "Priya Iyer",
      role: UserRole.JUDGE,
      password,
    },
  });

  // 2 Mentors
  const mentor1 = await prisma.user.create({
    data: {
      email: "mentor1@hackmate.dev",
      name: "Vikram Singh",
      role: UserRole.MENTOR,
      password,
    },
  });
  const mentor2 = await prisma.user.create({
    data: {
      email: "mentor2@hackmate.dev",
      name: "Neha Patel",
      role: UserRole.MENTOR,
      password,
    },
  });

  // 8 Participants
  const participantData = [
    { name: "Aditya Kumar", skills: ["React", "Node.js", "TypeScript"], year: "3rd year", looking: true, github: "aditya-kumar" },
    { name: "Sneha Reddy", skills: ["Python", "ML", "TensorFlow"], year: "Final year", looking: true, github: "sneha-reddy" },
    { name: "Rohan Das", skills: ["Flutter", "Firebase", "Dart"], year: "2nd year", looking: false, github: "rohan-das" },
    { name: "Ishita Gupta", skills: ["UI/UX", "Figma", "React"], year: "3rd year", looking: true, github: "ishita-gupta" },
    { name: "Arjun Mehta", skills: ["Go", "Docker", "K8s"], year: "Final year", looking: false, github: "arjun-mehta" },
    { name: "Kavya Nair", skills: ["Node.js", "PostgreSQL", "Redis"], year: "2nd year", looking: true, github: "kavya-nair" },
    { name: "Siddharth Rao", skills: ["React Native", "TypeScript"], year: "3rd year", looking: true, github: "sid-rao" },
    { name: "Ananya Joshi", skills: ["Python", "FastAPI", "MongoDB"], year: "Final year", looking: false, github: "ananya-joshi" },
  ];

  const participants: Awaited<ReturnType<typeof prisma.user.create>>[] = [];
  for (const p of participantData) {
    const user = await prisma.user.create({
      data: {
        email: `${p.github}@hackmate.dev`,
        name: p.name,
        role: UserRole.PARTICIPANT,
        password,
        githubUsername: p.github,
        profile: {
          create: {
            bio: `${p.year} student passionate about technology and building products.`,
            skills: p.skills,
            experience: p.year.includes("Final") ? "mid" : "junior",
            company: "Indian Institute of Technology",
            githubUrl: `https://github.com/${p.github}`,
            isPublic: true,
            isLookingForTeam: p.looking,
          },
        },
      },
    });
    participants.push(user);
  }

  // 1 Sponsor
  const sponsor = await prisma.user.create({
    data: {
      email: "sponsor@hackmate.dev",
      name: "TechCorp",
      role: UserRole.SPONSOR,
      password,
    },
  });

  console.log(`  Created ${1 + 2 + 2 + 8 + 1} users.\n`);

  // ==================== HACKATHON 1 — ONGOING ====================
  console.log("🏆 Creating hackathon (ONGOING)...");

  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const twoDaysLater = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  const oneDayLater = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
  const yesterday = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);

  const hackathon = await prisma.hackathon.create({
    data: {
      title: "HackMate Winter Hackathon 2026",
      description: "A 48-hour college hackathon focused on building tools for student life. Open to all branches and years.",
      shortDescription: "Build tools for student life in 48 hours",
      status: HackathonStatus.ONGOING,
      startDate: threeDaysAgo,
      endDate: twoDaysLater,
      registrationDeadline: yesterday,
      submissionDeadline: oneDayLater,
      maxTeamSize: 5,
      minTeamSize: 2,
      location: "IIT Delhi, Main Auditorium",
      isVirtual: false,
      prize: "$10,000",
      rules: JSON.stringify({ lockSubmissions: false, judgingOpen: false, blindMode: false }),
      organiserId: organiser.id,
      judges: { connect: [{ id: judge1.id }, { id: judge2.id }] },
      mentors: { connect: [{ id: mentor1.id }, { id: mentor2.id }] },
    },
  });

  // ==================== HACKATHON 2 — REGISTRATION ====================
  console.log("🏆 Creating hackathon (REGISTRATION)...");

  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const nextTwoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const hackathon2 = await prisma.hackathon.create({
    data: {
      title: "HackMate Summer Sprint 2026",
      description: "A weekend sprint focused on AI/ML projects. Prizes for best use of open-source models.",
      shortDescription: "AI/ML sprint weekend",
      status: HackathonStatus.REGISTRATION,
      startDate: nextWeek,
      endDate: nextTwoWeeks,
      registrationDeadline: nextWeek,
      submissionDeadline: nextTwoWeeks,
      maxTeamSize: 4,
      minTeamSize: 2,
      isVirtual: true,
      prize: "$5,000",
      organiserId: organiser.id,
      judges: { connect: [{ id: judge1.id }] },
      mentors: { connect: [{ id: mentor2.id }] },
    },
  });

  console.log("  Created 2 hackathons.\n");

  // ==================== REGISTRATIONS ====================
  console.log("📝 Creating registrations...");

  for (const p of participants) {
    const profile = participantData.find((d) => d.github === p.githubUsername) || participantData[0];
    await prisma.hackathonRegistration.create({
      data: {
        hackathonId: hackathon.id,
        userId: p.id,
        firstName: p.name.split(" ")[0],
        lastName: p.name.split(" ").slice(1).join(" "),
        email: p.email,
        phone: `+91${Math.floor(7000000000 + Math.random() * 3000000000)}`,
        gender: Math.random() > 0.5 ? "Male" : "Female",
        location: "New Delhi",
        instituteName: "Indian Institute of Technology",
        userType: "student",
        domain: "Computer Science",
        course: "B.Tech",
        courseSpecialization: "Computer Science",
        graduatingYear: 2026,
        courseDuration: "4 years",
        termsAccepted: true,
      },
    });
  }

  // Register some for hackathon 2 too
  for (let i = 0; i < 4; i++) {
    await prisma.hackathonRegistration.create({
      data: {
        hackathonId: hackathon2.id,
        userId: participants[i].id,
        firstName: participants[i].name.split(" ")[0],
        lastName: participants[i].name.split(" ").slice(1).join(" "),
        email: participants[i].email,
        phone: "+919876543210",
        gender: "Male",
        location: "Bangalore",
        instituteName: "Indian Institute of Technology",
        userType: "student",
        domain: "AI/ML",
        course: "B.Tech",
        courseSpecialization: "AI",
        graduatingYear: 2026,
        courseDuration: "4 years",
        termsAccepted: true,
      },
    });
  }

  console.log("  Created registrations for both hackathons.\n");

  // ==================== TIMELINE ====================
  console.log("⏰ Creating timeline events...");

  const timelineEvents = [
    { title: "Opening Ceremony", desc: "Welcome address and rules overview", type: "keynote", start: -2.5, end: -2, offset: 0 },
    { title: "Hacking Begins!", desc: "Start building your projects", type: "milestone", start: -2, end: -2, offset: 0 },
    { title: "React Workshop", desc: "Building UIs with React + Tailwind", type: "workshop", start: -1.5, end: -1, offset: 0 },
    { title: "Lunch Break", desc: "Catered lunch in the cafeteria", type: "break", start: -0.5, end: 0, offset: 0 },
    { title: "Firebase Deep Dive", desc: "Auth, Firestore, and real-time DB", type: "workshop", start: 0.5, end: 1, offset: 0 },
    { title: "Midnight Snacks", desc: "Pizza and energy drinks", type: "break", start: 1, end: 1.2, offset: 0 },
    { title: "Mentor Office Hours", desc: "1-on-1 sessions with mentors", type: "workshop", start: 1.5, end: 2, offset: 0 },
    { title: "Submissions Close", desc: "All projects must be submitted", type: "milestone", start: 2, end: 2, offset: 0 },
    { title: "Judging Round", desc: "Teams present to judges", type: "keynote", start: 2.2, end: 2.5, offset: 0 },
    { title: "Awards Ceremony", desc: "Winner announcements and prizes", type: "keynote", start: 2.6, end: 3, offset: 0 },
  ];

  for (const ev of timelineEvents) {
    const startTime = new Date(now.getTime() + ev.start * 24 * 60 * 60 * 1000);
    const endTime = new Date(now.getTime() + ev.end * 24 * 60 * 60 * 1000);
    await prisma.timeline.create({
      data: {
        hackathonId: hackathon.id,
        title: ev.title,
        description: ev.desc,
        startTime,
        endTime,
        type: ev.type,
        isActive: ev.start <= 0 && ev.end >= 0,
      },
    });
  }

  console.log("  Created 10 timeline events.\n");

  // ==================== TEAMS ====================
  console.log("👥 Creating teams...");

  const team1 = await prisma.team.create({
    data: {
      name: "CodeCrafters",
      description: "Full-stack team building student productivity tools",
      hackathonId: hackathon.id,
      creatorId: participants[0].id,
      status: TeamStatus.COMPLETE,
      isOpen: false,
      maxMembers: 4,
    },
  });

  const team2 = await prisma.team.create({
    data: {
      name: "ByteForce",
      description: "ML-powered solutions for campus life",
      hackathonId: hackathon.id,
      creatorId: participants[3].id,
      status: TeamStatus.COMPLETE,
      isOpen: false,
      maxMembers: 4,
    },
  });

  const team3 = await prisma.team.create({
    data: {
      name: "DevDynamos",
      description: "Mobile-first hackathon project",
      hackathonId: hackathon.id,
      creatorId: participants[5].id,
      status: TeamStatus.FORMING,
      isOpen: true,
      maxMembers: 4,
    },
  });

  // Team members
  await prisma.teamMember.createMany({
    data: [
      { teamId: team1.id, userId: participants[0].id, role: "leader" },
      { teamId: team1.id, userId: participants[1].id, role: "member" },
      { teamId: team1.id, userId: participants[2].id, role: "member" },
      { teamId: team2.id, userId: participants[3].id, role: "leader" },
      { teamId: team2.id, userId: participants[4].id, role: "member" },
      { teamId: team2.id, userId: participants[7].id, role: "member" },
      { teamId: team3.id, userId: participants[5].id, role: "leader" },
      { teamId: team3.id, userId: participants[6].id, role: "member" },
    ],
  });

  // Mentor assignments
  await prisma.teamMentor.createMany({
    data: [
      { teamId: team1.id, mentorId: mentor1.id },
      { teamId: team2.id, mentorId: mentor2.id },
      { teamId: team3.id, mentorId: mentor1.id },
    ],
  });

  console.log("  Created 3 teams with members and mentor assignments.\n");

  // ==================== JOIN REQUESTS ====================
  console.log("📨 Creating join requests...");

  // Pending request: participant[6] wants to join team2
  await prisma.joinRequest.create({
    data: {
      teamId: team2.id,
      userId: participants[6].id,
      requestedById: participants[6].id,
      status: "PENDING",
      message: "Hey! I'm a React Native dev, would love to join your team!",
    },
  });

  // Accepted request: participant[7] already in team2
  await prisma.joinRequest.create({
    data: {
      teamId: team1.id,
      userId: participants[7].id,
      requestedById: participants[7].id,
      status: "REJECTED",
      message: "I have Go/K8s experience, looking to contribute to infra.",
      respondedAt: yesterday,
    },
  });

  console.log("  Created 2 join requests (1 pending, 1 rejected).\n");

  // ==================== RUBRIC ====================
  console.log("📊 Creating rubric...");

  const rubric = await prisma.rubric.create({
    data: {
      hackathonId: hackathon.id,
      name: "Main Judging Rubric",
      description: "Standard judging criteria for HackMate events",
      maxScore: 100,
      isActive: true,
    },
  });

  const rubricItems = await Promise.all([
    prisma.rubricItem.create({ data: { rubricId: rubric.id, name: "Innovation", description: "How novel and creative is the idea?", weight: 30, maxScore: 10, order: 1 } }),
    prisma.rubricItem.create({ data: { rubricId: rubric.id, name: "Technical Execution", description: "Quality of code, architecture, and implementation", weight: 30, maxScore: 10, order: 2 } }),
    prisma.rubricItem.create({ data: { rubricId: rubric.id, name: "Impact", description: "How useful is this for the target audience?", weight: 20, maxScore: 10, order: 3 } }),
    prisma.rubricItem.create({ data: { rubricId: rubric.id, name: "Presentation", description: "Demo quality, clarity of explanation", weight: 20, maxScore: 10, order: 4 } }),
  ]);

  console.log("  Created rubric with 4 criteria (weights: 30/30/20/20).\n");

  // ==================== SUBMISSIONS ====================
  console.log("📦 Creating submissions...");

  // Team 1 — fully submitted, healthy
  const sub1 = await prisma.submission.create({
    data: {
      hackathonId: hackathon.id,
      teamId: team1.id,
      githubUrl: "https://github.com/aditya-kumar/hackmate-submission",
      liveUrl: "https://codecrafters.vercel.app",
      status: SubmissionStatus.SUBMITTED,
      description: "A real-time study group finder and collaborative note-taking app for college students. Uses WebRTC for video calls and Firebase for real-time sync.",
      technologies: ["React", "Firebase", "WebRTC", "Tailwind"],
      pitchDeckUrl: "/uploads/pitch-decks/codecrafters-deck.pdf",
      isHealthy: true,
      healthCheckAt: now,
      submittedAt: now,
    },
  });

  // Team 2 — submitted, healthy
  const sub2 = await prisma.submission.create({
    data: {
      hackathonId: hackathon.id,
      teamId: team2.id,
      githubUrl: "https://github.com/ishita-gupta/campus-ml-assistant",
      liveUrl: "https://campusml.vercel.app",
      status: SubmissionStatus.SUBMITTED,
      description: "AI-powered campus assistant that helps students find events, study resources, and connect with peers using ML recommendations.",
      technologies: ["Python", "FastAPI", "React", "OpenAI"],
      isHealthy: true,
      healthCheckAt: now,
      submittedAt: now,
    },
  });

  // Team 3 — NOT_SUBMITTED (still working)
  await prisma.submission.create({
    data: {
      hackathonId: hackathon.id,
      teamId: team3.id,
      githubUrl: "https://github.com/sid-rao/hackmate-mobile",
      liveUrl: "",
      status: SubmissionStatus.NOT_SUBMITTED,
      description: "Mobile app for hackathon management — WIP",
      technologies: ["React Native", "Expo"],
      isHealthy: false,
    },
  });

  console.log("  Created 3 submissions (2 submitted, 1 WIP).\n");

  // ==================== SCORES ====================
  console.log("⭐ Creating scores...");

  // Judge 1 scores for team 1
  for (const item of rubricItems) {
    const score = item.name === "Innovation" ? 8 : item.name === "Technical Execution" ? 9 : item.name === "Impact" ? 7 : 8;
    await prisma.score.create({
      data: {
        submissionId: sub1.id,
        rubricItemId: item.id,
        judgerId: judge1.id,
        score,
        comment: item.name === "Innovation" ? "Creative approach to study groups" : item.name === "Technical Execution" ? "Well-structured code, good use of Firebase" : item.name === "Impact" ? "Very relevant for college students" : "Clear demo, good presentation",
      },
    });
  }

  // Judge 2 scores for team 1
  for (const item of rubricItems) {
    const score = item.name === "Innovation" ? 7 : item.name === "Technical Execution" ? 8 : item.name === "Impact" ? 8 : 9;
    await prisma.score.create({
      data: {
        submissionId: sub1.id,
        rubricItemId: item.id,
        judgerId: judge2.id,
        score,
        comment: item.name === "Presentation" ? "Excellent demo, very polished" : "Solid implementation",
      },
    });
  }

  // Judge 1 scores for team 2
  for (const item of rubricItems) {
    const score = item.name === "Innovation" ? 9 : item.name === "Technical Execution" ? 7 : item.name === "Impact" ? 9 : 7;
    await prisma.score.create({
      data: {
        submissionId: sub2.id,
        rubricItemId: item.id,
        judgerId: judge1.id,
        score,
        comment: item.name === "Innovation" ? "Excellent ML integration" : "Good concept",
      },
    });
  }

  console.log("  Created scores for 2 submissions by 2 judges.\n");

  // ==================== ANNOUNCEMENTS ====================
  console.log("📢 Creating announcements...");

  await prisma.announcement.create({
    data: {
      hackathonId: hackathon.id,
      authorId: organiser.id,
      title: "Welcome to HackMate Winter Hackathon!",
      content: "[channel:website] Hello everyone! The hackathon has officially started. Hacking begins now. Good luck!",
      isUrgent: false,
      createdAt: threeDaysAgo,
    },
  });

  await prisma.announcement.create({
    data: {
      hackathonId: hackathon.id,
      authorId: organiser.id,
      title: "React Workshop starting in 30 mins",
      content: "[channel:website] Head to Room 201 for the React + Tailwind workshop. Bring your laptops!",
      isUrgent: true,
      createdAt: new Date(now.getTime() - 1.5 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.announcement.create({
    data: {
      hackathonId: hackathon.id,
      authorId: organiser.id,
      title: "12 hours remaining!",
      content: "[channel:website] Reminder: submissions close in 12 hours. Make sure your GitHub and Live URLs are working.",
      isUrgent: true,
      createdAt: new Date(now.getTime() - 0.5 * 24 * 60 * 60 * 1000),
    },
  });

  console.log("  Created 3 announcements (1 normal, 2 urgent).\n");

  // ==================== HELP TICKETS ====================
  console.log("🎫 Creating help tickets...");

  await prisma.helpTicket.create({
    data: {
      hackathonId: hackathon.id,
      creatorId: participants[2].id,
      assignedToId: mentor1.id,
      title: "Firebase Auth not working with Flutter",
      description: "I keep getting 'PlatformException' when trying to sign in with Google. I've added the SHA-1 key to Firebase console but it still fails.",
      status: TicketStatus.RESOLVED,
      priority: "high",
      category: "technical",
      resolvedAt: yesterday,
    },
  });

  await prisma.helpTicket.create({
    data: {
      hackathonId: hackathon.id,
      creatorId: participants[5].id,
      assignedToId: mentor1.id,
      title: "Need help with WebSocket implementation",
      description: "Trying to implement real-time chat but Socket.io isn't connecting. My server is on port 3001 and client on 3000.",
      status: TicketStatus.IN_PROGRESS,
      priority: "normal",
      category: "technical",
    },
  });

  await prisma.helpTicket.create({
    data: {
      hackathonId: hackathon.id,
      creatorId: participants[6].id,
      title: "Can we use third-party APIs?",
      description: "Is it allowed to use OpenAI API for our project? The rules didn't mention anything about external APIs.",
      status: TicketStatus.OPEN,
      priority: "low",
      category: "general",
    },
  });

  console.log("  Created 3 help tickets (1 resolved, 1 in-progress, 1 open).\n");

  // ==================== ATTENDANCE ====================
  console.log("📱 Creating attendance records...");

  // 5 participants checked in
  for (let i = 0; i < 5; i++) {
    await prisma.attendance.create({
      data: {
        hackathonId: hackathon.id,
        userId: participants[i].id,
        checkInTime: new Date(threeDaysAgo.getTime() + 60 * 60 * 1000), // 1 hour after start
        lunchRedeemed: i < 3,
        swagCollected: i < 2,
      },
    });
  }

  console.log("  Created 5 attendance records.\n");

  // ==================== CHAT MESSAGES ====================
  console.log("💬 Creating chat messages...");

  // Team 1 <-> Mentor 1
  await prisma.chatMessage.create({
    data: {
      hackathonId: hackathon.id,
      teamId: team1.id,
      userId: participants[0].id,
      content: "Hey Mentor! We're having trouble with the WebRTC peer connection setup. Any tips?",
      isFromMentor: false,
    },
  });
  await prisma.chatMessage.create({
    data: {
      hackathonId: hackathon.id,
      teamId: team1.id,
      mentorId: mentor1.id,
      content: "Sure! Make sure you're handling the ICE candidates properly. Use a STUN server like stun:stun.l.google.com:19302. I'll send you a code snippet.",
      isFromMentor: true,
    },
  });
  await prisma.chatMessage.create({
    data: {
      hackathonId: hackathon.id,
      teamId: team1.id,
      userId: participants[1].id,
      content: "That fixed it! Thank you so much! 🎉",
      isFromMentor: false,
    },
  });

  // Team 2 <-> Mentor 2
  await prisma.chatMessage.create({
    data: {
      hackathonId: hackathon.id,
      teamId: team2.id,
      userId: participants[3].id,
      content: "Neha, we want to add a recommendation engine. Should we use collaborative filtering or content-based?",
      isFromMentor: false,
    },
  });
  await prisma.chatMessage.create({
    data: {
      hackathonId: hackathon.id,
      teamId: team2.id,
      mentorId: mentor2.id,
      content: "For a hackathon MVP, go with content-based. It's simpler and doesn't need a user history matrix. You can use cosine similarity on skill tags.",
      isFromMentor: true,
    },
  });

  console.log("  Created 5 chat messages across 2 teams.\n");

  // ==================== STAFF INVITES ====================
  console.log("✉️  Creating staff invites...");

  await prisma.staffInvite.create({
    data: {
      hackathonId: hackathon2.id,
      email: "external-judge@university.edu",
      role: "JUDGE",
      token: "invite-judge-token-abc123",
      expiresAt: nextWeek,
      used: false,
    },
  });

  await prisma.staffInvite.create({
    data: {
      hackathonId: hackathon2.id,
      email: "external-mentor@university.edu",
      role: "MENTOR",
      token: "invite-mentor-token-def456",
      expiresAt: nextWeek,
      used: false,
    },
  });

  console.log("  Created 2 pending staff invites.\n");

  // ==================== CERTIFICATES (for ended-style demo) ====================
  console.log("📜 Creating certificates...");

  for (const p of participants) {
    await prisma.certificate.create({
      data: {
        hackathonId: hackathon.id,
        userId: p.id,
        type: CertificateType.PARTICIPANT,
        title: "Participation Certificate",
        description: "For participating in HackMate Winter Hackathon 2026",
      },
    });
  }

  // Winner cert for team1 members
  for (const mid of [participants[0].id, participants[1].id, participants[2].id]) {
    await prisma.certificate.create({
      data: {
        hackathonId: hackathon.id,
        userId: mid,
        teamId: team1.id,
        type: CertificateType.WINNER,
        title: "Winner Certificate",
        description: "1st Place — CodeCrafters",
      },
    });
  }

  console.log("  Created 11 certificates (8 participant + 3 winner).\n");

  // ==================== DONE ====================
  console.log("═══════════════════════════════════════════════════════");
  console.log("✅ SEED COMPLETE — All test data created!\n");
  console.log("📋 TEST ACCOUNTS (all use password: password123)");
  console.log("───────────────────────────────────────────────────────");
  console.log(`  Organiser:    organiser@hackmate.dev`);
  console.log(`  Judge 1:      judge1@hackmate.dev`);
  console.log(`  Judge 2:      judge2@hackmate.dev`);
  console.log(`  Mentor 1:     mentor1@hackmate.dev`);
  console.log(`  Mentor 2:     mentor2@hackmate.dev`);
  console.log(`  Participant:  aditya-kumar@hackmate.dev  (team leader, team1)`);
  console.log(`  Participant:  sneha-reddy@hackmate.dev   (team1 member)`);
  console.log(`  Participant:  ishita-gupta@hackmate.dev  (team leader, team2)`);
  console.log(`  Participant:  kavya-nair@hackmate.dev    (team3 leader, looking for team)`);
  console.log(`  Sponsor:      sponsor@hackmate.dev`);
  console.log("───────────────────────────────────────────────────────");
  console.log("\n📋 TEST SCENARIOS:");
  console.log("  1. Login as organiser → view dashboard → command center → CSV export");
  console.log("  2. Login as participant → view QR code → submit project → team management");
  console.log("  3. Login as judge → judging console → score teams → seal scores");
  console.log("  4. Login as mentor → help queue → claim/resolve tickets → team chat");
  console.log("  5. Login as participant (looking for team) → discover teams → send join request");
  console.log("  6. Organiser → lock/unlock submissions → extend deadline → broadcast announcement");
  console.log("═══════════════════════════════════════════════════════\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
