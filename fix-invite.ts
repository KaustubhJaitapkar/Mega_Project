import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const diya = await prisma.user.findUnique({
    where: { email: 'diya-gupta@hackmate.dev' }
  });
  const aarav = await prisma.user.findUnique({
    where: { email: 'aarav-kumar@hackmate.dev' }
  });
  
  if (!diya || !aarav) {
    console.log('Users not found');
    return;
  }
  
  // Find the pending join request from Aarav to Diya
  const joinRequest = await prisma.joinRequest.findFirst({
    where: {
      userId: diya.id,
      requestedById: aarav.id,
      status: 'PENDING'
    },
    include: {
      team: {
        select: { id: true, name: true, hackathonId: true }
      }
    }
  });
  
  if (!joinRequest) {
    console.log('No pending join request found');
    return;
  }
  
  console.log('Found join request:', joinRequest.id, 'to team', joinRequest.team.name, 'hackathon', joinRequest.team.hackathonId);
  
  // Check if Diya is already a member of any team in that hackathon
  const existingMembership = await prisma.teamMember.findFirst({
    where: {
      userId: diya.id,
      team: {
        hackathonId: joinRequest.team.hackathonId
      }
    },
    include: {
      team: {
        select: { id: true, name: true }
      }
    }
  });
  
  if (existingMembership) {
    console.log(`Diya is already a member of team "${existingMembership.team.name}" in hackathon ${joinRequest.team.hackathonId}. Rejecting join request.`);
    
    // Update the join request status to REJECTED
    await prisma.joinRequest.update({
      where: { id: joinRequest.id },
      data: { 
        status: 'REJECTED',
        respondedAt: new Date()
      }
    });
    console.log('Join request rejected.');
  } else {
    console.log('Diya is not a member of any team in that hackathon. No action needed.');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());