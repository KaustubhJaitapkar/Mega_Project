import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROK_API_KEY,
});

interface TeamData {
  id: string;
  name: string;
  skills: string[];
}

interface MentorData {
  id: string;
  name: string;
  skills: string[];
}

interface GroqMatch {
  teamId: string;
  mentorId: string;
  score?: number;
}

export async function POST(
  _req: Request,
  { params }: { params: { hackathonId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const actor = await prisma.user.findUnique({ where: { email: session.user.email } });
    const hackathon = await prisma.hackathon.findUnique({ where: { id: params.hackathonId } });
    if (!actor || !hackathon || hackathon.organiserId !== actor.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get unassigned teams with member skills and submission technologies
    const unassignedTeams = await prisma.team.findMany({
      where: {
        hackathonId: params.hackathonId,
        teamMentors: { none: {} }
      },
      include: {
        members: {
          include: {
            user: {
              include: { profile: true }
            }
          }
        },
        submission: {
          select: { technologies: true }
        }
      }
    });

    if (unassignedTeams.length === 0) {
      return NextResponse.json({ message: 'No unassigned teams found' });
    }

    // Get available mentors with skills
    const availableMentors = await prisma.user.findMany({
      where: {
        hackathonsMentoring: {
          some: { id: params.hackathonId }
        }
      },
      include: { profile: true }
    });

    if (availableMentors.length === 0) {
      return NextResponse.json({ error: 'No mentors available' }, { status: 400 });
    }

    // Build team data: combine member skills + submission technologies
    const teamData: TeamData[] = unassignedTeams.map(team => ({
      id: team.id,
      name: team.name,
      skills: [
        ...new Set([
          ...team.members.flatMap(m => m.user.profile?.skills || []),
          ...(team.submission?.technologies || [])
        ])
      ]
    }));

    if (availableMentors.length === 1) {
      const onlyMentorId = availableMentors[0].id;
      const assignments = await prisma.$transaction(
        teamData.map((team) =>
          prisma.teamMentor.create({
            data: {
              teamId: team.id,
              mentorId: onlyMentorId,
            },
          })
        )
      );

      return NextResponse.json({
        message: `${assignments.length} teams assigned to the only available mentor`,
        data: assignments,
      });
    }

    // Build mentor data
    const mentorData: MentorData[] = availableMentors.map(mentor => ({
      id: mentor.id,
      name: mentor.name || mentor.email,
      skills: mentor.profile?.skills || []
    }));

    // Call Groq API for intelligent matching
    const groqPrompt = `You are a hackathon mentor matching system. Your task is to match teams to mentors based on skill overlap.

Teams:
${teamData.map(t => `- ID: ${t.id}, Name: ${t.name}, Skills: [${t.skills.join(', ')}]`).join('\n')}

Mentors:
${mentorData.map(m => `- ID: ${m.id}, Name: ${m.name}, Skills: [${m.skills.join(', ')}]`).join('\n')}

Match each team to exactly ONE mentor. Prioritize skill overlap. If multiple mentors have similar skills for a team, pick the one best suited.

Return ONLY a JSON array of matches with no additional text:
[
  { "teamId": "team-uuid", "mentorId": "mentor-uuid" }
]`;

    const message = await groq.chat.completions.create({
      model: 'mixtral-8x7b-32768',
      messages: [
        {
          role: 'user',
          content: groqPrompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1024
    });

    let matches: GroqMatch[] = [];
    if (message.choices[0]?.message?.content) {
      try {
        const jsonStr = message.choices[0].message.content
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .trim();
        matches = JSON.parse(jsonStr);
      } catch (e) {
        console.warn('Failed to parse Groq response, falling back to random assignment', e);
        matches = [];
      }
    }

    const preferredMentorByTeam = new Map(
      matches
        .filter((match) => mentorData.some((m) => m.id === match.mentorId))
        .map((match) => [match.teamId, match.mentorId])
    );

    const mentorCounts = new Map<string, number>(
      mentorData.map((mentor) => [mentor.id, 0])
    );

    // Shuffle mentors to avoid ordering bias for equal loads
    const shuffledMentors = [...mentorData].sort(() => Math.random() - 0.5);

    const assignments = [];

    for (const team of teamData) {
      const preferredMentorId = preferredMentorByTeam.get(team.id);
      let minCount = Infinity;
      for (const mentorId of mentorCounts.keys()) {
        const count = mentorCounts.get(mentorId) || 0;
        if (count < minCount) minCount = count;
      }

      let chosenMentor = shuffledMentors.find(
        (mentor) => (mentorCounts.get(mentor.id) || 0) === minCount
      );

      if (preferredMentorId && (mentorCounts.get(preferredMentorId) || 0) === minCount) {
        chosenMentor = mentorData.find((m) => m.id === preferredMentorId) || chosenMentor;
      }

      if (!chosenMentor) continue;

      const assignment = await prisma.teamMentor.create({
        data: {
          teamId: team.id,
          mentorId: chosenMentor.id
        }
      });
      assignments.push(assignment);
      mentorCounts.set(chosenMentor.id, (mentorCounts.get(chosenMentor.id) || 0) + 1);
    }

    return NextResponse.json({
      message: `${assignments.length} mentors auto-assigned evenly to teams`,
      data: assignments
    });
  } catch (error) {
    console.error('Auto-assign error:', error);
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 });
  }
}
