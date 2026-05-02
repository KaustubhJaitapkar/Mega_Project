import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

interface TeamData {
  id: string;
  name: string;
  description: string;
  skills: string[];
  requirements: string;
  requirementSkills: string[];
  members: { name: string; skills: string[] }[];
  maxMembers: number;
  openSlots: number;
}

interface ParticipantData {
  id: string;
  name: string;
  skills: string[];
  skillsNeeded: string[];
  bio: string;
  domain: string;
}

interface SuggestionResult {
  id: string;
  score: number;
  reason: string;
}

function extractJsonArray(text: string): any[] {
  try {
    // Try direct parse first
    return JSON.parse(text);
  } catch {
    // Try to find JSON array pattern
    const arrayMatch = text.match(/\[\s*\{[\s\S]*?\}\s*\]/);
    if (arrayMatch) {
      try {
        return JSON.parse(arrayMatch[0]);
      } catch {
        // Continue to next attempt
      }
    }
    
    // Try to find array with more relaxed matching
    const relaxedMatch = text.match(/\[[\s\S]*?\]/);
    if (relaxedMatch) {
      try {
        return JSON.parse(relaxedMatch[0]);
      } catch {
        // Continue to next attempt
      }
    }
    
    // Try to fix common JSON issues
    let fixed = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .replace(/\n/g, ' ')
      .replace(/\r/g, '')
      .replace(/,\s*]/g, ']')  // Remove trailing commas
      .replace(/,\s*}/g, '}')  // Remove trailing commas in objects
      .trim();
    
    // Try to find array in the fixed text
    const fixedMatch = fixed.match(/\[[\s\S]*\]/);
    if (fixedMatch) {
      try {
        return JSON.parse(fixedMatch[0]);
      } catch {
        return [];
      }
    }
    
    return [];
  }
}

export async function POST(
  req: Request,
  { params }: { params: { hackathonId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ 
      where: { email: session.user.email },
      include: { profile: true }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { type, teamId, ghostSlots, teamRequirements } = await req.json();
    
    if (!type || !['teammates', 'teams'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type. Use "teammates" or "teams"' }, { status: 400 });
    }

    const hackathon = await prisma.hackathon.findUnique({
      where: { id: params.hackathonId },
      select: { id: true, title: true, description: true, themedTracks: true, maxTeamSize: true, minTeamSize: true }
    });

    if (!hackathon) {
      return NextResponse.json({ error: 'Hackathon not found' }, { status: 404 });
    }

    // Get current user's team if any
    const userTeam = await prisma.team.findFirst({
      where: {
        hackathonId: params.hackathonId,
        members: { some: { userId: user.id } }
      },
      include: {
        members: {
          include: {
            user: {
              include: { profile: true }
            }
          }
        }
      }
    });

    if (type === 'teammates') {
      // Get suggested teammates for user's team or solo user
      const soloUser = !userTeam ? user : null;
      const teamMembers = userTeam ? userTeam.members : [{ user }];
      const teamMemberIds = teamMembers.map(m => m.user.id);
      
      // Get all participants registered for this hackathon who are not in the user's team
      const registrations = await prisma.hackathonRegistration.findMany({
        where: { hackathonId: params.hackathonId },
        include: {
          user: {
            include: { profile: true }
          }
        }
      });

      const availableParticipants = registrations
        .filter(r => !teamMemberIds.includes(r.user.id))
        .map(r => ({
          id: r.user.id,
          name: r.user.name || 'Unknown',
          skills: r.user.profile?.skills || [],
          skillsNeeded: r.user.profile?.skillsNeeded || [],
          bio: r.user.profile?.bio || '',
          domain: r.domain || '',
          selectedTrack: r.selectedTrack || ''
        }));

      // Get team's current skills and needs
      const teamSkills = teamMembers.flatMap(m => m.user.profile?.skills || []);
      const teamNeededSkills = teamMembers.flatMap(m => m.user.profile?.skillsNeeded || []);
      // Ghost slots override members' skillsNeeded if provided
      const neededSkillsFromTeam = (ghostSlots && ghostSlots.length > 0) ? ghostSlots : teamNeededSkills;
      const teamDescription = userTeam ? (userTeam.description || '') : (user.profile?.bio || '');
      const teamName = userTeam ? userTeam.name : `${user.name}'s Team`;
      const openSlots = userTeam 
        ? userTeam.maxMembers - teamMembers.length 
        : (hackathon.maxTeamSize || 5) - 1; // Assume solo user can have up to maxTeamSize - 1 more members
      
      // Build prompt for Groq
      const groqPrompt = `You are a hackathon team matching assistant. Analyze the team and suggest the best teammates.

Team Information:
- Name: ${teamName}
- Description: ${teamDescription}
- Team Requirements: ${teamRequirements || 'Not specified'}
- Current Skills: ${[...new Set(teamSkills)].join(', ')}
- Needed Skills (from ghost slots): ${[...new Set(neededSkillsFromTeam)].join(', ')}
- Hackathon: ${hackathon.title}
- Themed Tracks: ${(hackathon.themedTracks || []).join(', ')}
- Open Slots: ${openSlots}

Available Participants:
${availableParticipants.map(p => `- ID: ${p.id}, Name: ${p.name}, Skills: [${p.skills.join(', ')}], Domain: ${p.domain}, Track: ${p.selectedTrack}, Bio: ${p.bio.substring(0, 100)}`).join('\n')}

Analyze each participant and suggest the top 6 who would be the best fit for this team. Consider:
1. Skill complementarity - do they have skills the team needs?
2. Domain expertise that matches the hackathon theme
3. Experience level that matches the team
4. Track alignment with the team's focus
5. Alignment with team requirements description

Return ONLY a JSON array of suggestions sorted by score (highest first):
[
  { "id": "participant-user-id", "score": 85, "reason": "Brief explanation of why they're a good fit" }
]`;

      const response = await client.responses.create({
        model: "openai/gpt-oss-20b",
        input: groqPrompt,
      });

      let suggestions: SuggestionResult[] = [];
      if (response.output_text) {
        try {
          const parsed = extractJsonArray(response.output_text);
          // Validate and filter suggestions
          suggestions = parsed.filter((s: any) => 
            s && 
            typeof s.id === 'string' && 
            typeof s.score === 'number' &&
            typeof s.reason === 'string'
          ).slice(0, 6);
        } catch (e) {
          console.warn('Failed to parse response for teammates', e, 'Raw:', response.output_text.substring(0, 500));
          suggestions = [];
        }
      }

      // If AI failed, fall back to simple matching
      if (suggestions.length === 0) {
        const teamSkillsLower = [...new Set(teamSkills.map(s => s.toLowerCase()))];
        const neededSkillsFromTeamLower = [...new Set(neededSkillsFromTeam.map(s => s.toLowerCase()))];
        suggestions = availableParticipants.map(p => {
          let score = 0;
          // Participant's skills match team's needed skills (complementarity)
          for (const skill of p.skills) {
            if (neededSkillsFromTeamLower.includes(skill.toLowerCase())) {
              score += 15;
            }
          }
          // Participant's skills match team's existing skills (already have)
          for (const skill of p.skills) {
            if (teamSkillsLower.includes(skill.toLowerCase())) {
              score += 5;
            }
          }

          return { id: p.id, score, reason: 'Skill match' };
        })
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 6);
      }

      // Enrich suggestions with participant data
      const enrichedSuggestions = suggestions.map(s => {
        const participant = availableParticipants.find(p => p.id === s.id);
        return {
          ...s,
          participant: participant || null
        };
      }).filter(s => s.participant);

      return NextResponse.json({ 
        data: enrichedSuggestions,
        teamName: teamName 
      });

    } else if (type === 'teams') {
      // Get suggested teams for the user to join
      const userSkills = user.profile?.skills || [];
      const userSkillsNeeded = user.profile?.skillsNeeded || [];
      
      // Get open teams with active requirements that the user is not part of
      const teams = await prisma.team.findMany({
        where: {
          hackathonId: params.hackathonId,
          isOpen: true,
          requirements: { some: { isActive: true } },
          NOT: {
            members: { some: { userId: user.id } }
          }
        },
        include: {
          members: {
            include: {
              user: {
                include: { profile: true }
              }
            }
          }
        }
      });



      // Fetch active team requirements for this hackathon
      const teamRequirements = await prisma.teamRequirement.findMany({
        where: {
          isActive: true,
          team: { hackathonId: params.hackathonId }
        },
        select: { teamId: true, skillsNeeded: true, title: true, description: true }
      });

      const teamRequirementMap = new Map(teamRequirements.map(r => [r.teamId, r]));

      const teamData: TeamData[] = teams.map(t => {
        const requirement = teamRequirementMap.get(t.id);
        return {
          id: t.id,
          name: t.name,
          description: t.description || '',
          skills: [...new Set(t.members.flatMap(m => m.user.profile?.skills || []))],
          requirements: requirement?.title || '',
          requirementSkills: requirement?.skillsNeeded || [],
          members: t.members.map(m => ({
            name: m.user.name || 'Unknown',
            skills: m.user.profile?.skills || []
          })),
          maxMembers: t.maxMembers,
          openSlots: t.maxMembers - t.members.length
        };
      });

      // Get user's registration for context
      const userReg = await prisma.hackathonRegistration.findFirst({
        where: {
          hackathonId: params.hackathonId,
          userId: user.id
        }
      });

      // Build prompt for Groq
      const groqPrompt = `You are a hackathon team matching assistant. Suggest the best teams for this participant to join.

Participant Information:
- Name: ${user.name}
- Skills: ${userSkills.join(', ')}
- Skills Needed: ${userSkillsNeeded.join(', ')}
- Bio: ${user.profile?.bio || 'Not provided'}
- Domain: ${userReg?.domain || 'Not specified'}
- Selected Track: ${userReg?.selectedTrack || 'Not specified'}

Hackathon:
- Title: ${hackathon.title}
- Themed Tracks: ${(hackathon.themedTracks || []).join(', ')}

Available Teams:
${teamData.map(t => `- ID: ${t.id}, Name: ${t.name}, Description: ${t.description}, Current Skills: [${t.skills.join(', ')}], Required Skills: [${t.requirementSkills.join(', ')}], Members: ${t.members.length}, Open Slots: ${t.openSlots}`).join('\n')}

Analyze each team and suggest the top 5 that would be the best fit for this participant. Consider:
1. Does the team need skills the participant has? (especially required skills)
2. Does the team have skills the participant needs (to learn from)?
3. Team's focus area matches participant's interests
4. Team has open slots

Return ONLY a JSON array of suggestions sorted by score (highest first):
[
  { "id": "team-id", "score": 85, "reason": "Brief explanation of why it's a good fit" }
]`;

      const response = await client.responses.create({
        model: "openai/gpt-oss-20b",
        input: groqPrompt,
      });

      let suggestions: SuggestionResult[] = [];
      if (response.output_text) {
        try {
          const parsed = extractJsonArray(response.output_text);
          // Validate and filter suggestions
          suggestions = parsed.filter((s: any) => 
            s && 
            typeof s.id === 'string' && 
            typeof s.score === 'number' &&
            typeof s.reason === 'string'
          ).slice(0, 5);
        } catch (e) {
          console.warn('Failed to parse response for teams', e, 'Raw:', response.output_text.substring(0, 500));
          suggestions = [];
        }
      }

      // If AI failed, fall back to simple matching
      if (suggestions.length === 0) {
        suggestions = teamData.map(t => {
          let score = 0;
          // Skills participant can contribute that are required by team (high weight)
          for (const skill of userSkills) {
            if (t.requirementSkills.some(s => s.toLowerCase() === skill.toLowerCase())) {
              score += 15;
            }
          }
          // Skills participant can contribute (team already has)
          for (const skill of userSkills) {
            if (t.skills.some(s => s.toLowerCase() === skill.toLowerCase())) {
              score += 5;
            }
          }
          // Skills participant needs (team has)
          for (const neededSkill of userSkillsNeeded) {
            if (t.skills.some(s => s.toLowerCase() === neededSkill.toLowerCase())) {
              score += 10;
            }
          }
          // Bonus for open slots
          score += t.openSlots * 2;
          return { id: t.id, score, reason: 'Skill and availability match' };
        })
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
      }

      // Enrich suggestions with team data
      const enrichedSuggestions = suggestions.map(s => {
        const team = teamData.find(t => t.id === s.id);
        return {
          ...s,
          team: team || null
        };
      }).filter(s => s.team);

      return NextResponse.json({ 
        data: enrichedSuggestions,
        userName: user.name 
      });
    }

  } catch (error) {
    console.error('Suggestion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
