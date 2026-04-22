import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: Request,
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

    const groqApiKey = process.env.GROK_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json({ error: 'GROK_API_KEY not configured' }, { status: 500 });
    }

    // Get unassigned teams
    const unassignedTeams = await prisma.team.findMany({
      where: {
        hackathonId: params.hackathonId,
        status: 'COMPLETE', // Only complete teams
        teamMentors: { none: {} }
      },
      select: {
        id: true,
        name: true,
        members: {
          include: { user: { select: { id: true, name: true, profile: true } } },
        },
        submission: { select: { technologies: true } },
      },
    });

    if (unassignedTeams.length === 0) {
      return NextResponse.json({ message: 'No unassigned teams found' });
    }

    // Get available mentors
    const availableMentors = await prisma.user.findMany({
      where: {
        hackathonsMentoring: {
          some: { id: params.hackathonId }
        }
      },
      select: { id: true, name: true, profile: true }
    });

    if (availableMentors.length === 0) {
      return NextResponse.json({ error: 'No mentors available' }, { status: 400 });
    }

    const teams = unassignedTeams.map((team) => {
      const memberSkills = team.members
        .flatMap((m) => m.user.profile?.skills || [])
        .filter(Boolean);
      const submissionSkills = team.submission?.technologies || [];
      const skills = Array.from(new Set([...memberSkills, ...submissionSkills]));
      return { id: team.id, name: team.name, skills };
    });

    const mentors = availableMentors.map((mentor) => ({
      id: mentor.id,
      name: mentor.name,
      skills: mentor.profile?.skills || [],
    }));

    const prompt = `You are matching mentors to hackathon teams based on skills.\n\nTeams (id, name, skills):\n${JSON.stringify(teams)}\n\nMentors (id, name, skills):\n${JSON.stringify(mentors)}\n\nRules:\n- Prefer mentors with the highest overlap in skills.\n- Do not reuse a mentor across multiple teams.\n- If a team has no clear skill match, still assign any remaining mentor.\n\nReturn ONLY valid JSON in this exact shape:\n{\n  "assignments": [\n    { "teamId": "...", "mentorId": "..." }\n  ]\n}`;

    const groqRes = await fetch('https://api.groq.com/openai/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b',
        input: prompt,
        temperature: 0.2,
      }),
    });

    if (!groqRes.ok) {
      const text = await groqRes.text();
      console.error('Groq error:', text);
      return NextResponse.json({ error: 'Groq request failed' }, { status: 500 });
    }

    const groqData = await groqRes.json();
    const outputText =
      typeof groqData?.output_text === 'string'
        ? groqData.output_text
        : groqData?.output?.[0]?.content?.[0]?.text;

    let modelAssignments: Array<{ teamId: string; mentorId: string }> = [];
    if (typeof outputText === 'string') {
      try {
        const parsed = JSON.parse(outputText);
        if (Array.isArray(parsed?.assignments)) {
          modelAssignments = parsed.assignments;
        }
      } catch (error) {
        console.error('Failed to parse Groq response:', error);
      }
    }

    const remainingMentors = new Map(mentors.map((m) => [m.id, m]));
    const pickedMentorIds = new Set<string>();
    const pickedTeamIds = new Set<string>();

    const orderedTeams = teams.map((t) => t.id);
    const chosenPairs: Array<{ teamId: string; mentorId: string }> = [];

    for (const assignment of modelAssignments) {
      if (!remainingMentors.has(assignment.mentorId)) continue;
      if (!orderedTeams.includes(assignment.teamId)) continue;
      if (pickedMentorIds.has(assignment.mentorId) || pickedTeamIds.has(assignment.teamId)) continue;
      pickedMentorIds.add(assignment.mentorId);
      pickedTeamIds.add(assignment.teamId);
      chosenPairs.push({ teamId: assignment.teamId, mentorId: assignment.mentorId });
    }

    const unassignedTeamIds = orderedTeams.filter((id) => !pickedTeamIds.has(id));
    const leftoverMentors = Array.from(remainingMentors.keys()).filter((id) => !pickedMentorIds.has(id));
    const shuffledMentors = leftoverMentors.sort(() => Math.random() - 0.5);

    for (let i = 0; i < Math.min(unassignedTeamIds.length, shuffledMentors.length); i++) {
      chosenPairs.push({ teamId: unassignedTeamIds[i], mentorId: shuffledMentors[i] });
    }

    const assignments = [];
    for (const pair of chosenPairs) {
      const assignment = await prisma.teamMentor.create({
        data: {
          teamId: pair.teamId,
          mentorId: pair.mentorId,
        },
      });
      assignments.push(assignment);
    }

    return NextResponse.json({
      message: `${assignments.length} mentors auto-assigned to teams`,
      data: assignments
    });
  } catch (error) {
    console.error('Auto-assign error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
