import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Find Diya Gupta
  const diya = await prisma.user.findUnique({
    where: { email: 'diya-gupta@hackmate.dev' },
    include: { profile: true }
  });
  console.log('Diya Gupta:', diya?.id, diya?.name);
  
  // Find Aarav Kumar
  const aarav = await prisma.user.findUnique({
    where: { email: 'aarav-kumar@hackmate.dev' },
  });
  console.log('Aarav Kumar:', aarav?.id, aarav?.name);
  
  // Check if Diya is already in a team for any hackathon
  const diyaTeamMemberships = await prisma.teamMember.findMany({
    where: { userId: diya?.id },
    include: { team: { select: { id: true, name: true, hackathonId: true } } }
  });
  console.log('Diya team memberships:', diyaTeamMemberships.length);
  diyaTeamMemberships.forEach(m => console.log('  Team:', m.team.name, 'Hackathon:', m.team.hackathonId));
  
  // Check pending join requests for Diya
  const joinRequests = await prisma.joinRequest.findMany({
    where: {
      userId: diya?.id,
      status: 'PENDING',
      requestedById: { not: diya?.id }
    },
    include: {
      team: { select: { id: true, name: true, hackathonId: true } },
      requestedBy: { select: { name: true, email: true } }
    }
  });
  console.log('Pending join requests for Diya:', joinRequests.length);
  joinRequests.forEach(req => {
    console.log(`  From: ${req.requestedBy?.name} (${req.requestedBy?.email}) to team ${req.team.name} (${req.team.hackathonId})`);
  });
  
  // Also check if there are any join requests where Diya is the requester (outgoing)
  const outgoingRequests = await prisma.joinRequest.findMany({
    where: {
      requestedById: diya?.id,
      status: 'PENDING'
    },
    include: {
      team: { select: { id: true, name: true } },
      user: { select: { name: true, email: true } }
    }
  });
  console.log('Outgoing requests from Diya:', outgoingRequests.length);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());