/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local', override: true });

const TABLES = [
  'User',
  'Account',
  'Session',
  'VerificationToken',
  'Profile',
  'Hackathon',
  '_judges',
  '_mentors',
  'Timeline',
  'Team',
  'HackathonRegistration',
  'Attendance',
  'StaffInvite',
  'Rubric',
  'RubricItem',
  'Submission',
  'Score',
  'Announcement',
  'HelpTicket',
  'TeamMember',
  'JoinRequest',
  'Certificate',
  'TeamMentor',
  'ChatMessage',
  'TeamRequirement',
  'RequirementInterest',
];

function quoteIdent(name) {
  return `"${name.replace(/"/g, '""')}"`;
}

async function main() {
  if (!process.env.NEON_DATABASE_URL) {
    throw new Error('Missing NEON_DATABASE_URL in .env.local');
  }
  if (!process.env.DATABASE_URL) {
    throw new Error('Missing Supabase DATABASE_URL in .env.local');
  }

  const source = new PrismaClient({
    datasources: { db: { url: process.env.NEON_DATABASE_URL } },
  });
  const target = new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL } },
  });

  try {
    for (const table of TABLES) {
      const quoted = quoteIdent(table);
      const rows = await source.$queryRawUnsafe(`select to_jsonb(t) as row from ${quoted} t`);
      const payload = JSON.stringify(rows.map((r) => r.row));

      if (rows.length > 0) {
        await target.$executeRawUnsafe(
          `insert into ${quoted} select * from jsonb_populate_recordset(null::${quoted}, $1::jsonb)`,
          payload
        );
      }

      console.log(`${table}: ${rows.length}`);
    }
  } finally {
    await source.$disconnect();
    await target.$disconnect();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
