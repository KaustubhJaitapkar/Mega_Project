import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type CountRow = { label: string; count: number };
type AverageRow = { label: string; average: number; count: number };

function label(value?: string | null, fallback = 'Unspecified') {
  return value?.trim() || fallback;
}

function addCount(target: Record<string, number>, key: string, amount = 1) {
  target[key] = (target[key] || 0) + amount;
}

function addAverage(target: Record<string, { sum: number; count: number }>, key: string, value: number) {
  if (!Number.isFinite(value)) return;
  if (!target[key]) target[key] = { sum: 0, count: 0 };
  target[key].sum += value;
  target[key].count += 1;
}

function rowsFromCounts(source: Record<string, number>, limit?: number): CountRow[] {
  const rows = Object.entries(source)
    .map(([name, count]) => ({ label: name, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  return typeof limit === 'number' ? rows.slice(0, limit) : rows;
}

function rowsFromAverages(source: Record<string, { sum: number; count: number }>, limit?: number): AverageRow[] {
  const rows = Object.entries(source)
    .map(([name, value]) => ({
      label: name,
      count: value.count,
      average: value.count > 0 ? Math.round((value.sum / value.count) * 100) / 100 : 0,
    }))
    .sort((a, b) => b.average - a.average || b.count - a.count || a.label.localeCompare(b.label));
  return typeof limit === 'number' ? rows.slice(0, limit) : rows;
}

function dominant(values: string[]) {
  const counts: Record<string, number> = {};
  values.forEach((value) => addCount(counts, value));
  return rowsFromCounts(counts, 1)[0]?.label || 'Unspecified';
}

export async function GET(
  req: NextRequest,
  { params }: { params: { hackathonId: string } }
) {
  try {
    const hackathon = await prisma.hackathon.findUnique({
      where: { id: params.hackathonId },
      select: {
        themedTracks: true,
        rankings: true,
        _count: {
          select: {
            teams: true,
            submissions: true,
            attendances: true,
          },
        },
      },
    });

    if (!hackathon) {
      return NextResponse.json(
        { error: 'Hackathon not found' },
        { status: 404 }
      );
    }

    const [submissions, scores, teams, registrations, tickets, certificates] = await Promise.all([
      prisma.submission.findMany({
        where: { hackathonId: params.hackathonId },
        select: { id: true, teamId: true, status: true, isHealthy: true, technologies: true },
      }),
      prisma.score.findMany({
        where: { submission: { hackathonId: params.hackathonId } },
        select: { score: true, submissionId: true },
      }),
      prisma.team.findMany({
        where: { hackathonId: params.hackathonId },
        select: {
          id: true,
          name: true,
          members: {
            select: {
              userId: true,
              user: {
                select: { profile: { select: { skills: true } } },
              },
            },
          },
        },
      }),
      prisma.hackathonRegistration.findMany({
        where: { hackathonId: params.hackathonId },
        select: {
          userId: true,
          gender: true,
          location: true,
          instituteName: true,
          domain: true,
          selectedTrack: true,
        },
      }),
      prisma.helpTicket.count({
        where: {
          hackathonId: params.hackathonId,
          status: { in: ['OPEN', 'IN_PROGRESS'] },
        },
      }),
      prisma.certificate.findMany({
        where: {
          hackathonId: params.hackathonId,
          type: { in: ['WINNER', 'RUNNER_UP', 'BEST_PROJECT'] },
        },
        select: { teamId: true, type: true },
      }),
    ]);

    const submittedCount = submissions.filter((s) => s.status === 'SUBMITTED').length;
    const healthyCount = submissions.filter((s) => s.isHealthy).length;
    const averageTeamSize =
      teams.length > 0
        ? teams.reduce((sum, t) => sum + t.members.length, 0) / teams.length
        : 0;
    const averageScore = scores.length > 0 
      ? scores.reduce((sum, s) => sum + s.score, 0) / scores.length 
      : 0;

    const teamDistribution = teams.reduce((acc: Record<number, number>, team) => {
      const size = team.members.length;
      acc[size] = (acc[size] || 0) + 1;
      return acc;
    }, {});

    const skillHeatmap: Record<string, number> = {};
    teams.forEach((team) => {
      team.members.forEach((member) => {
        const skills = member.user.profile?.skills || [];
        skills.forEach((s) => {
          skillHeatmap[s] = (skillHeatmap[s] || 0) + 1;
        });
      });
    });

    const registrationsByUser = new Map(registrations.map((registration) => [registration.userId, registration]));
    const submissionsByTeam = new Map(submissions.map((submission) => [submission.teamId, submission]));
    const scoresBySubmission = new Map<string, number[]>();
    scores.forEach((score) => {
      const list = scoresBySubmission.get(score.submissionId) || [];
      list.push(score.score);
      scoresBySubmission.set(score.submissionId, list);
    });

    const rankings = Array.isArray(hackathon.rankings) ? (hackathon.rankings as any[]) : [];
    const rankingsByTeam = new Map<string, any>(rankings.map((ranking) => [ranking.teamId, ranking]));
    const winnerTeamIds = new Set(certificates.map((certificate) => certificate.teamId).filter(Boolean) as string[]);

    const genderDistribution: Record<string, number> = {};
    const locationDistribution: Record<string, number> = {};
    const domainDistribution: Record<string, number> = {};
    const collegeDistribution: Record<string, number> = {};
    const participantsPerTrack: Record<string, number> = {};
    const teamsPerTrack: Record<string, number> = {};
    const submissionsPerTrack: Record<string, number> = {};
    const winnersByTrack: Record<string, number> = {};
    const winnersByDomain: Record<string, number> = {};
    const winnersByCollege: Record<string, number> = {};
    const averageScoreByDomain: Record<string, { sum: number; count: number }> = {};
    const averageScoreByCollege: Record<string, { sum: number; count: number }> = {};
    const averageScoreByTrack: Record<string, { sum: number; count: number }> = {};
    const averageScoreByTechnology: Record<string, { sum: number; count: number }> = {};
    const allTracks = new Set((hackathon.themedTracks || []).map((track) => label(track)));

    registrations.forEach((registration) => {
      const track = label(registration.selectedTrack, 'Unselected');
      addCount(genderDistribution, label(registration.gender));
      addCount(locationDistribution, label(registration.location));
      addCount(domainDistribution, label(registration.domain));
      addCount(collegeDistribution, label(registration.instituteName));
      addCount(participantsPerTrack, track);
      allTracks.add(track);
    });

    const scoreSpreadPerTeam = teams
      .map((team) => {
        const memberRegistrations = team.members
          .map((member) => registrationsByUser.get(member.userId))
          .filter(Boolean);
        const teamTrack = dominant(memberRegistrations.map((registration) => label(registration?.selectedTrack, 'Unselected')));
        const teamDomains = Array.from(new Set(memberRegistrations.map((registration) => label(registration?.domain))));
        const teamColleges = Array.from(new Set(memberRegistrations.map((registration) => label(registration?.instituteName))));
        const submission = submissionsByTeam.get(team.id);
        const teamScores = submission ? scoresBySubmission.get(submission.id) || [] : [];
        const ranking = rankingsByTeam.get(team.id);
        const totalScore =
          typeof ranking?.totalScore === 'number'
            ? ranking.totalScore
            : Math.round(teamScores.reduce((sum, score) => sum + score, 0) * 100) / 100;
        const teamAverage =
          teamScores.length > 0
            ? Math.round((teamScores.reduce((sum, score) => sum + score, 0) / teamScores.length) * 100) / 100
            : 0;

        addCount(teamsPerTrack, teamTrack);
        if (submission && submission.status !== 'NOT_SUBMITTED') addCount(submissionsPerTrack, teamTrack);

        if (totalScore > 0 || teamScores.length > 0) {
          teamDomains.forEach((domain) => addAverage(averageScoreByDomain, domain, totalScore));
          teamColleges.forEach((college) => addAverage(averageScoreByCollege, college, totalScore));
          addAverage(averageScoreByTrack, teamTrack, totalScore);
          (submission?.technologies || []).forEach((technology) => {
            addAverage(averageScoreByTechnology, label(technology), totalScore);
          });
        }

        const inferredWinner = typeof ranking?.rank === 'number' && ranking.rank <= 3 && totalScore > 0;
        if (winnerTeamIds.has(team.id) || inferredWinner) {
          addCount(winnersByTrack, teamTrack);
          teamDomains.forEach((domain) => addCount(winnersByDomain, domain));
          teamColleges.forEach((college) => addCount(winnersByCollege, college));
        }

        return {
          teamId: team.id,
          teamName: team.name,
          track: teamTrack,
          scoresCount: teamScores.length,
          minScore: teamScores.length > 0 ? Math.min(...teamScores) : 0,
          maxScore: teamScores.length > 0 ? Math.max(...teamScores) : 0,
          averageScore: teamAverage,
          totalScore,
        };
      })
      .sort((a, b) => b.totalScore - a.totalScore || a.teamName.localeCompare(b.teamName));

    allTracks.forEach((track) => {
      participantsPerTrack[track] = participantsPerTrack[track] || 0;
      teamsPerTrack[track] = teamsPerTrack[track] || 0;
      submissionsPerTrack[track] = submissionsPerTrack[track] || 0;
    });

    const trackRows = rowsFromCounts(participantsPerTrack);
    const activeTrackRows = trackRows.filter((row) => row.count > 0);

    const trends = {
      timestamp: new Date().toISOString(),
      teamCount: hackathon._count.teams,
      submissionCount: submittedCount,
      openTickets: tickets,
    };

    return NextResponse.json({
      data: {
        totalTeams: hackathon._count.teams,
        participantsCount: teams.reduce((sum, t) => sum + t.members.length, 0),
        totalSubmissions: hackathon._count.submissions,
        submittedCount,
        healthyCount,
        openTickets: tickets,
        totalAttendances: hackathon._count.attendances,
        averageTeamSize: Math.round(averageTeamSize * 100) / 100,
        averageScore: Math.round(averageScore * 100) / 100,
        totalScores: scores.length,
        teamDistribution,
        skillHeatmap: Object.entries(skillHeatmap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 15)
          .map(([skill, count]) => ({ skill, count })),
        postHackathon: {
          winnersByTrack: rowsFromCounts(winnersByTrack),
          winnersByDomain: rowsFromCounts(winnersByDomain),
          winnersByCollege: rowsFromCounts(winnersByCollege),
          genderDistribution: rowsFromCounts(genderDistribution),
          locationDistribution: rowsFromCounts(locationDistribution, 20),
          domainDistribution: rowsFromCounts(domainDistribution, 20),
          collegeDistribution: rowsFromCounts(collegeDistribution, 20),
        },
        trackAnalytics: {
          participantsPerTrack: trackRows,
          teamsPerTrack: rowsFromCounts(teamsPerTrack),
          submissionsPerTrack: rowsFromCounts(submissionsPerTrack),
          highestParticipation: activeTrackRows[0] || null,
          lowestParticipation: activeTrackRows[activeTrackRows.length - 1] || null,
        },
        qualityAnalytics: {
          averageScoreByDomain: rowsFromAverages(averageScoreByDomain, 20),
          averageScoreByCollege: rowsFromAverages(averageScoreByCollege, 20),
          averageScoreByTrack: rowsFromAverages(averageScoreByTrack),
          highestPerformingTechnologyStacks: rowsFromAverages(averageScoreByTechnology, 20),
          scoreSpreadPerTeam,
        },
        trends,
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
