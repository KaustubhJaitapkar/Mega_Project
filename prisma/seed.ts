import {
  PrismaClient,
  UserRole,
  HackathonStatus,
  TeamStatus,
  SubmissionStatus,
  CertificateType,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding for judging + certificates...");

  const defaultPassword = "Password123";
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  // ---------------- USERS ----------------

  const organiser = await prisma.user.create({
    data: {
      email: "organiser@test.com",
      name: "Organiser",
      role: UserRole.ORGANISER,
      password: hashedPassword,
    },
  });

  const judges = await Promise.all([
    prisma.user.create({
      data: { email: "judge1@test.com", name: "Judge 1", role: UserRole.JUDGE },
    }),
    prisma.user.create({
      data: { email: "judge2@test.com", name: "Judge 2", role: UserRole.JUDGE },
    }),
  ]);

  const mentors = await Promise.all([
    prisma.user.create({
      data: { email: "mentor1@test.com", name: "Mentor 1", role: UserRole.MENTOR },
    }),
    prisma.user.create({
      data: { email: "mentor2@test.com", name: "Mentor 2", role: UserRole.MENTOR },
    }),
  ]);

  // 15 participants
  const participants = [];
  for (let i = 1; i <= 15; i++) {
    const user = await prisma.user.create({
      data: {
        email: `p${i}@test.com`,
        name: `Participant ${i}`,
        role: UserRole.PARTICIPANT,
        password: hashedPassword,
      },
    });
    participants.push(user);
  }

  // ---------------- HACKATHON ----------------

  const hackathon = await prisma.hackathon.create({
    data: {
      title: "Judging Demo Hackathon",
      description: "Test judging and certificates",
      shortDescription: "Demo",
      status: HackathonStatus.ENDED,
      startDate: new Date(),
      endDate: new Date(),
      registrationDeadline: new Date(),
      submissionDeadline: new Date(),
      prize: "$5000",
      sponsorIds: ["Google", "Microsoft"],

      organiserId: organiser.id,

      judges: {
        connect: judges.map((j) => ({ id: j.id })),
      },
      mentors: {
        connect: mentors.map((m) => ({ id: m.id })),
      },
    },
  });

  // ---------------- RUBRIC ----------------

  const rubric = await prisma.rubric.create({
    data: {
      hackathonId: hackathon.id,
      name: "Main Judging Rubric",
      isActive: true,
    },
  });

  const rubricItems = await Promise.all([
    prisma.rubricItem.create({
      data: { rubricId: rubric.id, name: "Innovation", maxScore: 10 },
    }),
    prisma.rubricItem.create({
      data: { rubricId: rubric.id, name: "Technical", maxScore: 10 },
    }),
    prisma.rubricItem.create({
      data: { rubricId: rubric.id, name: "UI/UX", maxScore: 10 },
    }),
  ]);

  // ---------------- TEAMS ----------------

  const teams = [];

  for (let i = 0; i < 5; i++) {
    const team = await prisma.team.create({
      data: {
        name: `Team_${i + 1}`,
        hackathonId: hackathon.id,
        creatorId: participants[i * 3].id,
        status: TeamStatus.COMPLETE,
      },
    });

    // Add members (3 per team)
    await prisma.teamMember.createMany({
      data: [
        {
          teamId: team.id,
          userId: participants[i * 3].id,
          role: "leader",
        },
        {
          teamId: team.id,
          userId: participants[i * 3 + 1].id,
        },
        {
          teamId: team.id,
          userId: participants[i * 3 + 2].id,
        },
      ],
    });

    // Assign mentor
    await prisma.teamMentor.create({
      data: {
        teamId: team.id,
        mentorId: mentors[i % 2].id,
      },
    });

    teams.push(team);
  }

  // ---------------- SUBMISSIONS ----------------

  const submissions = [];

  for (let i = 0; i < teams.length; i++) {
    const submission = await prisma.submission.create({
      data: {
        hackathonId: hackathon.id,
        teamId: teams[i].id,
        githubUrl: "https://github.com/demo",
        liveUrl: "https://demo.com",
        status: SubmissionStatus.APPROVED,
        description: `Project ${i + 1}`,
        technologies: ["React", "Node"],
        isHealthy: true,
        submittedAt: new Date(),
      },
    });

    submissions.push(submission);
  }

  // ---------------- SCORING ----------------

  const teamScores: { teamId: string; total: number }[] = [];

  for (const submission of submissions) {
    let total = 0;

    for (const judge of judges) {
      for (const item of rubricItems) {
        const scoreValue = Math.floor(Math.random() * 10);

        total += scoreValue;

        await prisma.score.create({
          data: {
            submissionId: submission.id,
            rubricItemId: item.id,
            judgerId: judge.id,
            score: scoreValue,
          },
        });
      }
    }

    teamScores.push({ teamId: submission.teamId, total });
  }

  // ---------------- WINNERS ----------------

  teamScores.sort((a, b) => b.total - a.total);

  const winner = teamScores[0];
  const runnerUp = teamScores[1];

  // ---------------- CERTIFICATES ----------------

  // Winner
  const winnerMembers = await prisma.teamMember.findMany({
    where: { teamId: winner.teamId },
  });

  for (const member of winnerMembers) {
    await prisma.certificate.create({
      data: {
        hackathonId: hackathon.id,
        userId: member.userId,
        teamId: winner.teamId,
        type: CertificateType.WINNER,
        title: "Winner Certificate",
      },
    });
  }

  // Runner Up
  const runnerMembers = await prisma.teamMember.findMany({
    where: { teamId: runnerUp.teamId },
  });

  for (const member of runnerMembers) {
    await prisma.certificate.create({
      data: {
        hackathonId: hackathon.id,
        userId: member.userId,
        teamId: runnerUp.teamId,
        type: CertificateType.RUNNER_UP,
        title: "Runner Up Certificate",
      },
    });
  }

  // Participation certificates
  for (const p of participants) {
    await prisma.certificate.create({
      data: {
        hackathonId: hackathon.id,
        userId: p.id,
        type: CertificateType.PARTICIPANT,
        title: "Participation Certificate",
      },
    });
  }

  console.log("✅ Seed complete: judging + certificates ready");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());