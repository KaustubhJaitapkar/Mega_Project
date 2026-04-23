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

// Real GitHub repos for realistic submissions
const REAL_GITHUB_REPOS = [
  {
    url: "https://github.com/facebook/react",
    name: "React",
    owner: "facebook",
    description: "A declarative, efficient, and flexible JavaScript library for building user interfaces.",
    topics: ["react", "javascript", "frontend", "ui"],
    stars: 225000,
  },
  {
    url: "https://github.com/vercel/next.js",
    name: "Next.js",
    owner: "vercel",
    description: "The React Framework for the Web",
    topics: ["react", "nextjs", "javascript", "framework"],
    stars: 125000,
  },
  {
    url: "https://github.com/twbs/bootstrap",
    name: "Bootstrap",
    owner: "twbs",
    description: "The most popular HTML, CSS, and JavaScript framework for developing responsive, mobile first projects.",
    topics: ["bootstrap", "css", "framework", "responsive"],
    stars: 168000,
  },
  {
    url: "https://github.com/microsoft/vscode",
    name: "VS Code",
    owner: "microsoft",
    description: "Visual Studio Code - Open source code editor.",
    topics: ["editor", "ide", "typescript", "vscode"],
    stars: 158000,
  },
  {
    url: "https://github.com/tensorflow/tensorflow",
    name: "TensorFlow",
    owner: "tensorflow",
    description: "An Open Source Machine Learning Framework for Everyone",
    topics: ["machine-learning", "deep-learning", "neural-network", "python"],
    stars: 182000,
  },
  {
    url: "https://github.com/nodejs/node",
    name: "Node.js",
    owner: "nodejs",
    description: "Node.js JavaScript runtime",
    topics: ["nodejs", "javascript", "runtime", "backend"],
    stars: 105000,
  },
  {
    url: "https://github.com/rust-lang/rust",
    name: "Rust",
    owner: "rust-lang",
    description: "Empowering everyone to build reliable and efficient software.",
    topics: ["rust", "compiler", "programming-language"],
    stars: 92000,
  },
  {
    url: "https://github.com/vuejs/vue",
    name: "Vue.js",
    owner: "vuejs",
    description: "Vue.js is a progressive, incrementally-adoptable JavaScript framework for building UI on the web.",
    topics: ["vue", "javascript", "framework", "frontend"],
    stars: 207000,
  },
];

// Realistic tech skills for participants
const SKILLS_POOL = [
  "React", "Next.js", "Vue.js", "Angular", "Svelte",
  "TypeScript", "JavaScript", "Python", "Java", "Go", "Rust",
  "Node.js", "Express", "Django", "Flask", "FastAPI",
  "PostgreSQL", "MongoDB", "Redis", "MySQL", "Prisma",
  "Docker", "Kubernetes", "AWS", "Azure", "GCP",
  "Machine Learning", "TensorFlow", "PyTorch", "OpenAI",
  "Figma", "UI/UX", "TailwindCSS", "Styled Components",
  "GraphQL", "REST API", "WebSocket", "WebRTC",
  "Blockchain", "Solidity", "Smart Contracts",
  "Mobile Dev", "React Native", "Flutter", "Swift",
  "DevOps", "CI/CD", "GitHub Actions", "Jenkins",
];

// Indian colleges for realistic data
const COLLEGES = [
  "IIT Bombay", "IIT Delhi", "IIT Madras", "IIT Kanpur", "IIT Kharagpur",
  "NIT Trichy", "NIT Surathkal", "BITS Pilani", "IIIT Hyderabad",
  "MIT Manipal", "VIT Vellore", "SRM University", "Anna University",
  "DTU Delhi", "NSIT Delhi", "PES University Bangalore",
];

// Tech domains
const DOMAINS = [
  "Computer Science", "Information Technology", "Electronics",
  "Mechanical", "Civil", "Data Science", "AI/ML",
];

async function main() {
  console.log("🌱 Seeding comprehensive test data...\n");

  // Wipe existing data
  console.log("🧹 Cleaning existing data...");
  await prisma.$transaction([
    prisma.score.deleteMany(),
    prisma.certificate.deleteMany(),
    prisma.chatMessage.deleteMany(),
    prisma.teamMentor.deleteMany(),
    prisma.joinRequest.deleteMany(),
    prisma.attendance.deleteMany(),
    prisma.helpTicket.deleteMany(),
    prisma.announcement.deleteMany(),
    prisma.submission.deleteMany(),
    prisma.teamMember.deleteMany(),
    prisma.team.deleteMany(),
    prisma.timeline.deleteMany(),
    prisma.rubricItem.deleteMany(),
    prisma.rubric.deleteMany(),
    prisma.hackathonRegistration.deleteMany(),
    prisma.staffInvite.deleteMany(),
    prisma.hackathon.deleteMany(),
    prisma.profile.deleteMany(),
    prisma.account.deleteMany(),
    prisma.session.deleteMany(),
    prisma.user.deleteMany(),
  ]);
  console.log("  Done.\n");

  const password = await bcrypt.hash("password123", 10);

  // ==================== USERS ====================
  console.log("👤 Creating users...");

  // 1 Organiser
  const organiser = await prisma.user.create({
    data: {
      email: "organiser@hackmate.dev",
      name: "Alex Chen",
      role: UserRole.ORGANISER,
      password,
      profile: {
        create: {
          bio: "Passionate hackathon organiser with 5+ years of experience. Love building communities.",
          skills: ["Event Management", "Community Building", "Public Speaking"],
          company: "TechEvents Inc.",
          experience: "senior",
          country: "India",
          isPublic: true,
        },
      },
    },
  });

  // 3 Judges
  const judges = await Promise.all(
    [
      { name: "Dr. Sarah Johnson", email: "judge1@hackmate.dev", company: "Google" },
      { name: "Prof. Rahul Sharma", email: "judge2@hackmate.dev", company: "Microsoft" },
      { name: "Emily Zhang", email: "judge3@hackmate.dev", company: "Meta" },
    ].map((j) =>
      prisma.user.create({
        data: {
          email: j.email,
          name: j.name,
          role: UserRole.JUDGE,
          password,
          profile: {
            create: {
              bio: `Senior engineer at ${j.company}. Expert in system design and architecture.`,
              skills: ["System Design", "Architecture", "Code Review", "Mentoring"],
              company: j.company,
              experience: "senior",
              isPublic: true,
            },
          },
        },
      })
    )
  );

  // 4 Mentors
  const mentors = await Promise.all(
    [
      { name: "Michael Brown", email: "mentor1@hackmate.dev", expertise: ["React", "Node.js", "TypeScript"] },
      { name: "Priya Patel", email: "mentor2@hackmate.dev", expertise: ["Python", "Machine Learning", "Data Science"] },
      { name: "David Kim", email: "mentor3@hackmate.dev", expertise: ["DevOps", "Docker", "Kubernetes"] },
      { name: "Lisa Wong", email: "mentor4@hackmate.dev", expertise: ["UI/UX", "Figma", "Design Systems"] },
    ].map((m) =>
      prisma.user.create({
        data: {
          email: m.email,
          name: m.name,
          role: UserRole.MENTOR,
          password,
          profile: {
            create: {
              bio: `Experienced developer specializing in ${m.expertise.join(", ")}.`,
              skills: m.expertise,
              experience: "mid",
              isPublic: true,
            },
          },
        },
      })
    )
  );

  // 30 Participants with realistic profiles
  const participantNames = [
    { name: "Aarav Kumar", github: "aarav-kumar", skills: ["React", "Node.js", "TypeScript"] },
    { name: "Aditi Sharma", github: "aditi-sharma", skills: ["Python", "Machine Learning", "TensorFlow"] },
    { name: "Arjun Patel", github: "arjun-patel", skills: ["Next.js", "PostgreSQL", "Prisma"] },
    { name: "Diya Gupta", github: "diya-gupta", skills: ["UI/UX", "Figma", "React"] },
    { name: "Ishaan Reddy", github: "ishaan-reddy", skills: ["Go", "Docker", "Kubernetes"] },
    { name: "Kavya Singh", github: "kavya-singh", skills: ["Flutter", "Firebase", "Dart"] },
    { name: "Krishna Iyer", github: "krishna-iyer", skills: ["Java", "Spring Boot", "MySQL"] },
    { name: "Lakshmi Nair", github: "lakshmi-nair", skills: ["Python", "Django", "Redis"] },
    { name: "Neha Joshi", github: "neha-joshi", skills: ["React Native", "TypeScript", "GraphQL"] },
    { name: "Rohan Malhotra", github: "rohan-malhotra", skills: ["Rust", "WebAssembly", "Systems"] },
    { name: "Saanvi Desai", github: "saanvi-desai", skills: ["Vue.js", "Node.js", "MongoDB"] },
    { name: "Vihaan Choudhary", github: "vihaan-choudhary", skills: ["AWS", "Terraform", "DevOps"] },
    { name: "Aanya Mehta", github: "aanya-mehta", skills: ["Blockchain", "Solidity", "Web3"] },
    { name: "Advait Bhat", github: "advait-bhat", skills: ["Swift", "iOS", "Mobile Dev"] },
    { name: "Ananya Rao", github: "ananya-rao", skills: ["Data Science", "Pandas", "NumPy"] },
    { name: "Dev Khanna", github: "dev-khanna", skills: ["React", "TailwindCSS", "Next.js"] },
    { name: "Ira Banerjee", github: "ira-banerjee", skills: ["Machine Learning", "PyTorch", "Python"] },
    { name: "Kabir Sethi", github: "kabir-sethi", skills: ["Node.js", "Express", "MongoDB"] },
    { name: "Mira Agarwal", github: "mira-agarwal", skills: ["UI/UX", "Adobe XD", "Figma"] },
    { name: "Nikhil Verma", github: "nikhil-verma", skills: ["Java", "Android", "Kotlin"] },
    { name: "Omkar Pillai", github: "omkar-pillai", skills: ["Python", "FastAPI", "PostgreSQL"] },
    { name: "Parth Shah", github: "parth-shah", skills: ["Angular", "TypeScript", "RxJS"] },
    { name: "Reyansh Dubey", github: "reyansh-dubey", skills: ["Docker", "Kubernetes", "CI/CD"] },
    { name: "Siya Menon", github: "siya-menon", skills: ["React", "GraphQL", "Apollo"] },
    { name: "Tanishq Yadav", github: "tanishq-yadav", skills: ["C++", "Game Dev", "Unreal Engine"] },
    { name: "Vedant Mishra", github: "vedant-mishra", skills: ["Python", "Data Analysis", "SQL"] },
    { name: "Yash Thakur", github: "yash-thakur", skills: ["JavaScript", "Node.js", "Express"] },
    { name: "Zara Qureshi", github: "zara-qureshi", skills: ["React", "Redux", "TypeScript"] },
    { name: "Ayaan Saxena", github: "ayaan-saxena", skills: ["PHP", "Laravel", "MySQL"] },
    { name: "Iraan Bose", github: "iraan-bose", skills: ["Rust", "Systems", "Low Level"] },
  ];

  const participants = await Promise.all(
    participantNames.map(async (p, i) => {
      const college = COLLEGES[Math.floor(Math.random() * COLLEGES.length)];
      const domain = DOMAINS[Math.floor(Math.random() * DOMAINS.length)];

      return prisma.user.create({
        data: {
          email: `${p.github}@hackmate.dev`,
          name: p.name,
          role: UserRole.PARTICIPANT,
          password,
          githubUsername: p.github,
          profile: {
            create: {
              bio: `${domain} student at ${college}. Passionate about building innovative solutions.`,
              skills: p.skills,
              company: college,
              experience: i < 10 ? "junior" : i < 20 ? "mid" : "senior",
              country: "India",
              githubUrl: `https://github.com/${p.github}`,
              isPublic: true,
              isLookingForTeam: Math.random() > 0.5,
            },
          },
        },
      });
    })
  );

  // 1 Sponsor
  const sponsor = await prisma.user.create({
    data: {
      email: "sponsor@hackmate.dev",
      name: "TechCorp",
      role: UserRole.SPONSOR,
      password,
      profile: {
        create: {
          bio: "Leading technology company supporting innovation and student developers.",
          company: "TechCorp",
          experience: "senior",
          isPublic: true,
        },
      },
    },
  });

  console.log(`  Created 1 organiser, ${judges.length} judges, ${mentors.length} mentors, ${participants.length} participants, 1 sponsor.\n`);

  // ==================== HACKATHONS ====================
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneWeekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const twoWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const threeWeeksLater = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000);

  console.log("🏆 Creating hackathons...");

  const hackathon1 = await prisma.hackathon.create({
    data: {
      title: "AI Innovation Challenge 2025",
      tagline: "Build the future with AI",
      description: `Join us for a 48-hour hackathon focused on Artificial Intelligence and Machine Learning.

Participants will work on real-world problems using cutting-edge AI technologies. Mentorship from industry experts will be available throughout the event.

Prizes worth $50,000 including cloud credits, hardware, and cash rewards.`,
      shortDescription: "48-hour AI/ML focused hackathon with $50K prizes",
      status: HackathonStatus.DRAFT,
      startDate: twoWeeksLater,
      endDate: new Date(twoWeeksLater.getTime() + 2 * 24 * 60 * 60 * 1000),
      registrationDeadline: new Date(twoWeeksLater.getTime() - 2 * 24 * 60 * 60 * 1000),
      submissionDeadline: new Date(twoWeeksLater.getTime() + 2 * 24 * 60 * 60 * 1000 - 1 * 60 * 60 * 1000),
      maxTeamSize: 4,
      minTeamSize: 2,
      isVirtual: true,
      prize: "$50,000",
      rules: "1. Teams must have 2-4 members\n2. All code must be written during the hackathon\n3. Use of open-source libraries is allowed\n4. Projects must be original work\n5. Final submission must include source code and demo video",
      contactEmail: "ai-hackathon@hackmate.dev",
      hostName: "AI Research Lab",
      theme: "Artificial Intelligence",
      eligibilityDomain: "Open to all students and professionals",
      breakfastProvided: true,
      lunchProvided: true,
      dinnerProvided: true,
      swagProvided: true,
      sponsorDetails: [
        { name: "NVIDIA", tier: "Platinum", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Nvidia_logo.svg/1200px-Nvidia_logo.svg.png" },
        { name: "Google Cloud", tier: "Gold", logoUrl: "https://cloud.google.com/_static/cloud/images/social-icon-google-cloud-1200-630.png" },
        { name: "Hugging Face", tier: "Silver", logoUrl: "https://huggingface.co/front/assets/huggingface_logo.svg" },
      ],
      judgeDetails: [
        { name: judges[0].name, email: judges[0].email, company: "Google" },
        { name: judges[1].name, email: judges[1].email, company: "Microsoft" },
      ],
      mentorDetails: [
        { name: mentors[1].name, email: mentors[1].email, expertise: "Machine Learning" },
        { name: mentors[2].name, email: mentors[2].email, expertise: "DevOps" },
      ],
      organiserId: organiser.id,
      judges: { connect: [{ id: judges[0].id }, { id: judges[1].id }] },
      mentors: { connect: [{ id: mentors[1].id }, { id: mentors[2].id }] },
      timelines: {
        create: [
          { title: "Opening Ceremony", description: "Welcome and kickoff", startTime: twoWeeksLater, endTime: new Date(twoWeeksLater.getTime() + 1 * 60 * 60 * 1000), type: "ceremony" },
          { title: "Hacking Starts", startTime: new Date(twoWeeksLater.getTime() + 1 * 60 * 60 * 1000), endTime: new Date(twoWeeksLater.getTime() + 1 * 60 * 60 * 1000), type: "milestone" },
          { title: "Workshop: Building with LLMs", description: "Hands-on workshop", startTime: new Date(twoWeeksLater.getTime() + 6 * 60 * 60 * 1000), endTime: new Date(twoWeeksLater.getTime() + 8 * 60 * 60 * 1000), type: "workshop" },
          { title: "Submission Deadline", startTime: new Date(twoWeeksLater.getTime() + 47 * 60 * 60 * 1000), endTime: new Date(twoWeeksLater.getTime() + 47 * 60 * 60 * 1000), type: "milestone" },
          { title: "Closing Ceremony", description: "Winners announcement", startTime: new Date(twoWeeksLater.getTime() + 50 * 60 * 60 * 1000), endTime: new Date(twoWeeksLater.getTime() + 52 * 60 * 60 * 1000), type: "ceremony" },
        ],
      },
    },
  });

  const hackathon2 = await prisma.hackathon.create({
    data: {
      title: "Web3 Buildathon",
      tagline: "Decentralize everything",
      description: `A 72-hour hackathon exploring blockchain, DeFi, NFTs, and Web3 technologies.

Build decentralized applications that solve real problems. Learn from industry leaders and win amazing prizes.

Topics include: DeFi protocols, NFT marketplaces, DAO tooling, Layer 2 solutions`,
      shortDescription: "72-hour Web3 hackathon exploring blockchain and DeFi",
      status: HackathonStatus.REGISTRATION,
      startDate: oneWeekLater,
      endDate: new Date(oneWeekLater.getTime() + 3 * 24 * 60 * 60 * 1000),
      registrationDeadline: new Date(oneWeekLater.getTime() - 1 * 24 * 60 * 60 * 1000),
      submissionDeadline: new Date(oneWeekLater.getTime() + 3 * 24 * 60 * 60 * 1000 - 2 * 60 * 60 * 1000),
      maxTeamSize: 5,
      minTeamSize: 1,
      isVirtual: true,
      prize: "$75,000",
      rules: "1. Teams can have 1-5 members\n2. Projects must use blockchain technology\n3. Smart contracts must be deployed to testnet\n4. Code must be open source\n5. Demo must be functional",
      contactEmail: "web3@hackmate.dev",
      hostName: "Blockchain Association",
      theme: "Web3 & Blockchain",
      eligibilityDomain: "Open to all",
      breakfastProvided: true,
      lunchProvided: true,
      dinnerProvided: false,
      swagProvided: true,
      sponsorDetails: [
        { name: "Ethereum Foundation", tier: "Platinum", logoUrl: "https://ethereum.org/static/6b935ac0e6194247347855dc3d328e83/13c43/eth-home-icon.webp" },
        { name: "Polygon", tier: "Gold", logoUrl: "https://polygon.technology/_next/static/media/polygon-logo.9e547ef4.svg" },
        { name: "Chainlink", tier: "Gold", logoUrl: "https://chain.link/images/chainlink-logo.svg" },
      ],
      judgeDetails: [
        { name: judges[1].name, email: judges[1].email, company: "Microsoft" },
        { name: judges[2].name, email: judges[2].email, company: "Meta" },
      ],
      mentorDetails: [
        { name: mentors[0].name, email: mentors[0].email, expertise: "Full Stack" },
        { name: mentors[2].name, email: mentors[2].email, expertise: "Infrastructure" },
      ],
      organiserId: organiser.id,
      judges: { connect: [{ id: judges[1].id }, { id: judges[2].id }] },
      mentors: { connect: [{ id: mentors[0].id }, { id: mentors[2].id }] },
      timelines: {
        create: [
          { title: "Kickoff", startTime: oneWeekLater, endTime: new Date(oneWeekLater.getTime() + 2 * 60 * 60 * 1000), type: "ceremony" },
          { title: "Team Formation", startTime: new Date(oneWeekLater.getTime() + 2 * 60 * 60 * 1000), endTime: new Date(oneWeekLater.getTime() + 4 * 60 * 60 * 1000), type: "networking" },
          { title: "Workshop: Smart Contract Security", startTime: new Date(oneWeekLater.getTime() + 8 * 60 * 60 * 1000), endTime: new Date(oneWeekLater.getTime() + 10 * 60 * 60 * 1000), type: "workshop" },
          { title: "Midpoint Check-in", startTime: new Date(oneWeekLater.getTime() + 36 * 60 * 60 * 1000), endTime: new Date(oneWeekLater.getTime() + 38 * 60 * 60 * 1000), type: "milestone" },
          { title: "Submissions Due", startTime: new Date(oneWeekLater.getTime() + 70 * 60 * 60 * 1000), endTime: new Date(oneWeekLater.getTime() + 70 * 60 * 60 * 1000), type: "milestone" },
        ],
      },
    },
  });

  const hackathon3 = await prisma.hackathon.create({
    data: {
      title: "HealthTech Innovation Sprint",
      tagline: "Code for better health",
      description: `Build solutions that improve healthcare access, patient outcomes, and medical research.

This hybrid hackathon brings together healthcare professionals, developers, and designers to create impactful health tech solutions.

Challenge areas: Telemedicine platforms, Mental health apps, Medical data visualization, Health monitoring IoT`,
      shortDescription: "Hybrid healthcare hackathon - improving lives through tech",
      status: HackathonStatus.ONGOING,
      startDate: oneWeekAgo,
      endDate: new Date(oneWeekAgo.getTime() + 5 * 24 * 60 * 60 * 1000),
      registrationDeadline: new Date(oneWeekAgo.getTime() - 3 * 24 * 60 * 60 * 1000),
      submissionDeadline: new Date(oneWeekAgo.getTime() + 5 * 24 * 60 * 60 * 1000 - 2 * 60 * 60 * 1000),
      maxTeamSize: 6,
      minTeamSize: 2,
      isVirtual: false,
      location: "Bangalore, India",
      prize: "$100,000",
      rules: "1. Teams: 2-6 members\n2. At least one healthcare professional or student per team\n3. Solutions must address real healthcare challenges\n4. HIPAA compliance required for patient data\n5. Final demo must be live and functional",
      contactEmail: "health@hackmate.dev",
      hostName: "Health Innovation Hub",
      theme: "Healthcare Technology",
      eligibilityDomain: "Healthcare professionals, students, and developers",
      breakfastProvided: true,
      lunchProvided: true,
      dinnerProvided: true,
      swagProvided: true,
      sponsorDetails: [
        { name: "Practo", tier: "Platinum", logoUrl: "https://www.practo.com/nav/9.5.0/consumer/images/practo-logo.svg" },
        { name: "PharmEasy", tier: "Gold", logoUrl: "https://assets.pharmeasy.in/apothecary/images/logo_big.svg" },
        { name: "Tata Health", tier: "Silver", logoUrl: "https://www.tatahealth.com/images/logo.svg" },
      ],
      judgeDetails: [
        { name: judges[0].name, email: judges[0].email, company: "Google Health" },
        { name: judges[1].name, email: judges[1].email, company: "Microsoft Healthcare" },
        { name: judges[2].name, email: judges[2].email, company: "Meta" },
      ],
      mentorDetails: [
        { name: mentors[0].name, email: mentors[0].email, expertise: "Web Development" },
        { name: mentors[1].name, email: mentors[1].email, expertise: "Data Science" },
        { name: mentors[3].name, email: mentors[3].email, expertise: "Design" },
      ],
      organiserId: organiser.id,
      judges: { connect: judges.map((j) => ({ id: j.id })) },
      mentors: { connect: mentors.map((m) => ({ id: m.id })) },
      timelines: {
        create: [
          { title: "Registration Opens", startTime: new Date(oneWeekAgo.getTime() - 14 * 24 * 60 * 60 * 1000), endTime: new Date(oneWeekAgo.getTime() - 14 * 24 * 60 * 60 * 1000), type: "milestone" },
          { title: "Registration Closes", startTime: new Date(oneWeekAgo.getTime() - 3 * 24 * 60 * 60 * 1000), endTime: new Date(oneWeekAgo.getTime() - 3 * 24 * 60 * 60 * 1000), type: "milestone" },
          { title: "Opening Ceremony", startTime: oneWeekAgo, endTime: new Date(oneWeekAgo.getTime() + 2 * 60 * 60 * 1000), type: "ceremony" },
          { title: "Hacking Begins", startTime: new Date(oneWeekAgo.getTime() + 2 * 60 * 60 * 1000), endTime: new Date(oneWeekAgo.getTime() + 2 * 60 * 60 * 1000), type: "milestone" },
          { title: "Workshop: Healthcare UX", startTime: new Date(oneWeekAgo.getTime() + 24 * 60 * 60 * 1000), endTime: new Date(oneWeekAgo.getTime() + 26 * 60 * 60 * 1000), type: "workshop" },
          { title: "Submission Deadline", startTime: new Date(oneWeekAgo.getTime() + 118 * 60 * 60 * 1000), endTime: new Date(oneWeekAgo.getTime() + 118 * 60 * 60 * 1000), type: "milestone" },
          { title: "Demos & Judging", startTime: new Date(oneWeekAgo.getTime() + 120 * 60 * 60 * 1000), endTime: new Date(oneWeekAgo.getTime() + 124 * 60 * 60 * 1000), type: "ceremony" },
        ],
      },
    },
  });

  const hackathon4 = await prisma.hackathon.create({
    data: {
      title: "Green Earth Hackathon 2024",
      tagline: "Tech for a sustainable future",
      description: `A 48-hour hackathon focused on environmental sustainability and climate tech.

Teams built innovative solutions addressing climate change, renewable energy, waste management, and sustainable agriculture.

Over 500 participants, 120+ projects submitted.`,
      shortDescription: "Climate tech hackathon - 500+ participants, 120+ projects",
      status: HackathonStatus.ENDED,
      startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000),
      registrationDeadline: new Date(now.getTime() - 32 * 24 * 60 * 60 * 1000),
      submissionDeadline: new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000 - 2 * 60 * 60 * 1000),
      maxTeamSize: 5,
      minTeamSize: 2,
      isVirtual: true,
      prize: "$60,000",
      rules: "1. Teams: 2-5 members\n2. Projects must address environmental challenges\n3. Open source encouraged\n4. Demo video required\n5. Live pitch presentation",
      contactEmail: "green@hackmate.dev",
      hostName: "Green Tech Alliance",
      theme: "Climate & Sustainability",
      eligibilityDomain: "Open to all",
      breakfastProvided: false,
      lunchProvided: false,
      dinnerProvided: false,
      swagProvided: true,
      sponsorDetails: [
        { name: "Tesla", tier: "Platinum", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/Tesla_Motors.svg/1200px-Tesla_Motors.svg.png" },
        { name: "Siemens", tier: "Gold", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Siemens-logo.svg/1200px-Siemens-logo.svg.png" },
      ],
      judgeDetails: [
        { name: judges[0].name, email: judges[0].email, company: "Google" },
        { name: judges[2].name, email: judges[2].email, company: "Meta" },
      ],
      mentorDetails: [
        { name: mentors[1].name, email: mentors[1].email, expertise: "Data Analysis" },
        { name: mentors[2].name, email: mentors[2].email, expertise: "IoT" },
      ],
      organiserId: organiser.id,
      judges: { connect: [{ id: judges[0].id }, { id: judges[2].id }] },
      mentors: { connect: [{ id: mentors[1].id }, { id: mentors[2].id }] },
      timelines: {
        create: [
          { title: "Registration", startTime: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000), endTime: new Date(now.getTime() - 32 * 24 * 60 * 60 * 1000), type: "milestone" },
          { title: "Opening Ceremony", startTime: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), endTime: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), type: "ceremony" },
          { title: "Project Submissions", startTime: new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000 - 2 * 60 * 60 * 1000), endTime: new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000), type: "milestone" },
          { title: "Winners Announced", startTime: new Date(now.getTime() - 27 * 24 * 60 * 60 * 1000), endTime: new Date(now.getTime() - 27 * 24 * 60 * 60 * 1000), type: "ceremony" },
        ],
      },
    },
  });

  console.log("  Created 4 hackathons (DRAFT, REGISTRATION, ONGOING, ENDED).\n");

  // ==================== REGISTRATIONS & TEAMS ====================
  console.log("📝 Creating registrations, teams, and submissions...");

  const teamNames = [
    "Code Warriors", "Tech Titans", "Digital Nomads", "Byte Brigade",
    "Pixel Pirates", "Data Dragons", "Cloud Chasers", "AI Avengers",
  ];

  // Create teams for ongoing hackathon (HealthTech)
  for (let i = 0; i < 8; i++) {
    const leader = participants[i * 3];
    const member1 = participants[i * 3 + 1];
    const member2 = participants[i * 3 + 2];

    // Register participants
    await Promise.all(
      [leader, member1, member2].map((p) =>
        prisma.hackathonRegistration.create({
          data: {
            hackathonId: hackathon3.id,
            userId: p.id,
            firstName: p.name.split(" ")[0],
            lastName: p.name.split(" ").slice(1).join(" ") || "",
            email: p.email,
            phone: `+91${Math.floor(7000000000 + Math.random() * 3000000000)}`,
            gender: Math.random() > 0.5 ? "Male" : "Female",
            location: "India",
            instituteName: COLLEGES[Math.floor(Math.random() * COLLEGES.length)],
            differentlyAbled: false,
            userType: "student",
            domain: DOMAINS[Math.floor(Math.random() * DOMAINS.length)],
            course: "B.Tech",
            courseSpecialization: "Computer Science",
            graduatingYear: 2025,
            courseDuration: "4 years",
            termsAccepted: true,
          },
        })
      )
    );

    // Create attendance records
    await Promise.all(
      [leader, member1, member2].map((p) =>
        prisma.attendance.create({
          data: {
            hackathonId: hackathon3.id,
            userId: p.id,
            checkInTime: new Date(oneWeekAgo.getTime() + Math.random() * 2 * 60 * 60 * 1000),
            breakfastRedeemed: Math.random() > 0.3,
            lunchRedeemed: Math.random() > 0.3,
            swagCollected: Math.random() > 0.5,
          },
        })
      )
    );

    // Create team
    const team = await prisma.team.create({
      data: {
        name: teamNames[i],
        description: `Building innovative solutions for ${hackathon3.theme}`,
        hackathonId: hackathon3.id,
        creatorId: leader.id,
        isOpen: i % 2 === 0,
        maxMembers: 5,
        status: TeamStatus.FORMING,
        members: {
          create: [
            { userId: leader.id, role: "leader" },
            { userId: member1.id, role: "member" },
            { userId: member2.id, role: "member" },
          ],
        },
      },
    });

    // Assign mentor to some teams
    if (i < 4) {
      await prisma.teamMentor.create({
        data: {
          teamId: team.id,
          mentorId: mentors[i % mentors.length].id,
          assignedAt: new Date(oneWeekAgo.getTime() + 1 * 60 * 60 * 1000),
        },
      });
    }

    // Create submission for some teams with real GitHub repos
    if (i < 5) {
      const repo = REAL_GITHUB_REPOS[i % REAL_GITHUB_REPOS.length];
      await prisma.submission.create({
        data: {
          hackathonId: hackathon3.id,
          teamId: team.id,
          githubUrl: repo.url,
          liveUrl: `https://${repo.name.toLowerCase().replace(/\s+/g, "-")}-demo.vercel.app`,
          description: `An innovative health solution using ${repo.name}. ${repo.description}`,
          technologies: repo.topics,
          status: SubmissionStatus.SUBMITTED,
          isHealthy: true,
          healthCheckAt: new Date(),
          submittedAt: new Date(oneWeekAgo.getTime() + 5 * 24 * 60 * 60 * 1000),
        },
      });
    }

    // Create help tickets for some teams
    if (i < 3) {
      await prisma.helpTicket.create({
        data: {
          hackathonId: hackathon3.id,
          creatorId: leader.id,
          assignedToId: mentors[i % mentors.length].id,
          title: [`Need help with deployment`, `API integration issues`, `Database design help`][i],
          description: `We're facing issues with ${["deploying to AWS", "integrating third-party APIs", "optimizing database queries"][i]}. Need urgent assistance.`,
          status: i === 0 ? TicketStatus.IN_PROGRESS : TicketStatus.OPEN,
          priority: i === 0 ? "high" : "normal",
          category: i === 2 ? "technical" : "general",
        },
      });
    }
  }

  // Create registrations for registration hackathon (Web3)
  for (let i = 24; i < 30; i++) {
    await prisma.hackathonRegistration.create({
      data: {
        hackathonId: hackathon2.id,
        userId: participants[i].id,
        firstName: participants[i].name.split(" ")[0],
        lastName: participants[i].name.split(" ").slice(1).join(" ") || "",
        email: participants[i].email,
        phone: `+91${Math.floor(7000000000 + Math.random() * 3000000000)}`,
        gender: Math.random() > 0.5 ? "Male" : "Female",
        location: "India",
        instituteName: COLLEGES[Math.floor(Math.random() * COLLEGES.length)],
        differentlyAbled: false,
        userType: "student",
        domain: "Computer Science",
        course: "B.Tech",
        courseSpecialization: "Blockchain",
        graduatingYear: 2025,
        courseDuration: "4 years",
        termsAccepted: true,
      },
    });
  }

  // Create teams and submissions for ended hackathon (Green Earth)
  for (let i = 0; i < 4; i++) {
    const leader = participants[i];
    const member1 = participants[i + 4];

    // Create registrations
    await Promise.all(
      [leader, member1].map((p) =>
        prisma.hackathonRegistration.create({
          data: {
            hackathonId: hackathon4.id,
            userId: p.id,
            firstName: p.name.split(" ")[0],
            lastName: p.name.split(" ").slice(1).join(" ") || "",
            email: p.email,
            phone: `+91${Math.floor(7000000000 + Math.random() * 3000000000)}`,
            gender: Math.random() > 0.5 ? "Male" : "Female",
            location: "India",
            instituteName: COLLEGES[Math.floor(Math.random() * COLLEGES.length)],
            differentlyAbled: false,
            userType: "student",
            domain: "Computer Science",
            course: "B.Tech",
            courseSpecialization: "Environmental Tech",
            graduatingYear: 2025,
            courseDuration: "4 years",
            termsAccepted: true,
          },
        })
      )
    );

    // Create attendance with all meals redeemed
    await Promise.all(
      [leader, member1].map((p) =>
        prisma.attendance.create({
          data: {
            hackathonId: hackathon4.id,
            userId: p.id,
            checkInTime: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
            checkOutTime: new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000),
            breakfastRedeemed: true,
            lunchRedeemed: true,
            swagCollected: true,
          },
        })
      )
    );

    const team = await prisma.team.create({
      data: {
        name: `${["Eco", "Green", "Sustain", "Renew"][i]} ${["Builders", "Hackers", "Innovators", "Coders"][i]}`,
        description: `Sustainable solutions for ${["renewable energy", "waste management", "carbon tracking", "smart agriculture"][i]}`,
        hackathonId: hackathon4.id,
        creatorId: leader.id,
        isOpen: false,
        maxMembers: 5,
        status: TeamStatus.COMPLETE,
        members: {
          create: [
            { userId: leader.id, role: "leader" },
            { userId: member1.id, role: "member" },
          ],
        },
      },
    });

    // Create completed submissions with real repos
    const repo = REAL_GITHUB_REPOS[i + 4];
    const submission = await prisma.submission.create({
      data: {
        hackathonId: hackathon4.id,
        teamId: team.id,
        githubUrl: repo.url,
        liveUrl: `https://${repo.name.toLowerCase().replace(/\s+/g, "-")}-eco-demo.netlify.app`,
        description: `A climate tech solution built with ${repo.name}. Helps reduce carbon footprint through smart ${["monitoring", "tracking", "optimization", "automation"][i]}.`,
        technologies: [...repo.topics, "Sustainability", "Green Tech"],
        status: SubmissionStatus.APPROVED,
        isHealthy: true,
        healthCheckAt: new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000),
        submittedAt: new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000 - 2 * 60 * 60 * 1000),
      },
    });

    // Create certificates for ended hackathon
    await Promise.all(
      [leader, member1].map((p) =>
        prisma.certificate.create({
          data: {
            hackathonId: hackathon4.id,
            userId: p.id,
            teamId: team.id,
            type: i === 0 ? CertificateType.WINNER : i === 1 ? CertificateType.RUNNER_UP : CertificateType.PARTICIPANT,
            title: i === 0 ? "First Place Winner" : i === 1 ? "Second Place" : "Participant",
            description: `For outstanding contribution to ${hackathon4.title}`,
            issuedAt: new Date(now.getTime() - 27 * 24 * 60 * 60 * 1000),
          },
        })
      )
    );
  }

  console.log("  Created registrations, teams, submissions, and certificates.\n");

  // ==================== ANNOUNCEMENTS ====================
  console.log("📢 Creating announcements...");

  await prisma.announcement.createMany({
    data: [
      {
        hackathonId: hackathon3.id,
        authorId: organiser.id,
        title: "🎉 Welcome to HealthTech Innovation Sprint!",
        content: "Get ready for an amazing 5 days of innovation! Check-in opens at 9 AM. Breakfast will be served in Hall A.",
        isUrgent: false,
      },
      {
        hackathonId: hackathon3.id,
        authorId: organiser.id,
        title: "⚠️ Important: Submission Deadline Extended",
        content: "Due to technical issues, submission deadline extended by 2 hours. New deadline: Sunday 10 PM.",
        isUrgent: true,
      },
      {
        hackathonId: hackathon3.id,
        authorId: organiser.id,
        title: "🍕 Lunch is served!",
        content: "Lunch is now available in the cafeteria. Vegetarian and non-vegetarian options available.",
        isUrgent: false,
      },
      {
        hackathonId: hackathon2.id,
        authorId: organiser.id,
        title: "🚀 Registration Now Open!",
        content: "Web3 Buildathon registration is now open. Limited spots available - register early!",
        isUrgent: false,
      },
    ],
  });

  console.log("  Created 4 announcements.\n");

  // ==================== JOIN REQUESTS ====================
  console.log("📨 Creating join requests...");

  const someTeam = await prisma.team.findFirst({
    where: { hackathonId: hackathon3.id },
  });

  if (someTeam) {
    // Use participant 28 (not in any team yet)
    const requester = participants[28];
    
    // Check if already registered
    const existingReg = await prisma.hackathonRegistration.findUnique({
      where: { hackathonId_userId: { hackathonId: hackathon3.id, userId: requester.id } },
    });
    
    if (!existingReg) {
      await prisma.hackathonRegistration.create({
        data: {
          hackathonId: hackathon3.id,
          userId: requester.id,
          firstName: requester.name.split(" ")[0],
          lastName: requester.name.split(" ").slice(1).join(" ") || "",
          email: requester.email,
          phone: `+91${Math.floor(7000000000 + Math.random() * 3000000000)}`,
          gender: "Male",
          location: "India",
          instituteName: "IIT Bombay",
          differentlyAbled: false,
          userType: "student",
          domain: "Computer Science",
          course: "B.Tech",
          courseSpecialization: "AI/ML",
          graduatingYear: 2025,
          courseDuration: "4 years",
          termsAccepted: true,
        },
      });
    }

    await prisma.joinRequest.create({
      data: {
        teamId: someTeam.id,
        userId: requester.id,
        requestedById: requester.id,
        status: "PENDING",
        message: "Hi! I'm a full-stack developer with React and Node.js experience. Would love to join your team!",
      },
    });
  }

  console.log("  Created pending join request.\n");

  // ==================== CHAT MESSAGES ====================
  console.log("💬 Creating chat messages...");

  const team1 = await prisma.team.findFirst({
    where: { hackathonId: hackathon3.id },
    include: { members: { include: { user: true } } },
  });

  if (team1 && team1.members.length > 0) {
    await prisma.chatMessage.create({
      data: {
        hackathonId: hackathon3.id,
        teamId: team1.id,
        userId: team1.members[0].userId,
        content: "Hey Mentor! We're having trouble with the deployment. Any tips?",
        isFromMentor: false,
      },
    });
    await prisma.chatMessage.create({
      data: {
        hackathonId: hackathon3.id,
        teamId: team1.id,
        mentorId: mentors[0].id,
        content: "Sure! Make sure you're handling environment variables properly. Check your production build config.",
        isFromMentor: true,
      },
    });
  }

  console.log("  Created chat messages.\n");

  // ==================== DONE ====================
  console.log("═══════════════════════════════════════════════════════");
  console.log("✅ SEED COMPLETE — All test data created!\n");
  console.log("📊 SUMMARY:");
  console.log(`  • 4 Hackathons (DRAFT, REGISTRATION, ONGOING, ENDED)`);
  console.log(`  • 1 Organiser, ${judges.length} Judges, ${mentors.length} Mentors`);
  console.log(`  • ${participants.length} Participants with realistic profiles`);
  console.log(`  • 8+ Teams across hackathons`);
  console.log(`  • Real GitHub repos linked to submissions`);
  console.log(`  • Attendance records with meal tracking`);
  console.log(`  • Help tickets and mentor assignments`);
  console.log(`  • Certificates for ended hackathon`);
  console.log("");
  console.log("🔑 TEST CREDENTIALS (all use: password123)");
  console.log("───────────────────────────────────────────────────────");
  console.log(`  Organiser:   organiser@hackmate.dev`);
  console.log(`  Judge:       judge1@hackmate.dev`);
  console.log(`  Mentor:      mentor1@hackmate.dev`);
  console.log(`  Participant: aarav-kumar@hackmate.dev`);
  console.log(`  Sponsor:     sponsor@hackmate.dev`);
  console.log("───────────────────────────────────────────────────────");
  console.log("\n📋 TEST SCENARIOS:");
  console.log("  1. Organiser → Create/edit hackathons → Manage teams → QR scanner");
  console.log("  2. Participant → Browse hackathons → Join teams → Submit projects");
  console.log("  3. Judge → Review submissions → Score teams → View leaderboards");
  console.log("  4. Mentor → Help tickets → Chat with teams → Track progress");
  console.log("  5. Team lead → Invite teammates → Manage ghost slots → Request help");
  console.log("═══════════════════════════════════════════════════════\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());