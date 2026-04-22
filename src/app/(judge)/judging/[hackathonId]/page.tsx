'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface Submission {
  id: string;
  status: string;
  githubUrl?: string;
  liveUrl?: string;
  description?: string;
  technologies: string[];
  team: {
    id: string;
    name: string;
    members: Array<any>;
  };
  scores: Array<any>;
}

interface RubricItem {
  id: string;
  name: string;
  maxScore: number;
  weight: number;
}

export default function JudgingPage() {
  const params = useParams();
  const hackathonId = params.hackathonId as string;
  const [teamRows, setTeamRows] = useState<Array<{ id: string; name: string; submissionId: string | null; scored: boolean }>>([]);
  const [submissions, setSubmissions] = useState<Record<string, Submission>>({});
  const [rubricItems, setRubricItems] = useState<RubricItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState('');
  const [seal, setSeal] = useState(false);
  const [blindMode, setBlindMode] = useState(false);
  const [gitActivity, setGitActivity] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const [teamsRes, hackathonRes, rubricRes] = await Promise.all([
          fetch(`/api/judge/teams?hackathonId=${hackathonId}`),
          fetch(`/api/hackathons/${hackathonId}`),
          fetch(`/api/judge/rubric?hackathonId=${hackathonId}`),
        ]);

        const teamsData = await teamsRes.json();
        const hackathonData = await hackathonRes.json();
        const rubricData = await rubricRes.json();

        const rows = teamsData.data?.teams || [];
        setTeamRows(rows);
        setBlindMode(!!teamsData.data?.blindMode);
        const subMap: Record<string, Submission> = {};
        const list = hackathonData.data?.submissions || [];
        list.forEach((s: Submission) => {
          subMap[s.id] = s;
        });
        setSubmissions(subMap);
        setRubricItems(rubricData.data?.items || []);

        if (rows.length > 0) {
          setSelectedIndex(0);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    if (hackathonId) {
      fetchData();
    }
  }, [hackathonId]);

  const selectedTeam = teamRows[selectedIndex] || null;
  const selectedSubmission = selectedTeam?.submissionId ? submissions[selectedTeam.submissionId] : null;
  const scoredCount = teamRows.filter((t) => t.scored).length;
  const progressPct = teamRows.length > 0 ? Math.round((scoredCount / teamRows.length) * 100) : 0;

  useEffect(() => {
    async function loadGitActivity() {
      setGitActivity('');
      const url = selectedSubmission?.githubUrl;
      if (!url) return;
      const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
      if (!match) return;
      const [, owner, repoRaw] = match;
      const repo = repoRaw.replace(/\.git$/, '');
      try {
        const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=1`);
        const data = await res.json();
        const commitDate = data?.[0]?.commit?.author?.date;
        if (commitDate) {
          const hrs = Math.floor((Date.now() - new Date(commitDate).getTime()) / 36e5);
          setGitActivity(`Last commit ${hrs}h ago${hrs > 72 ? ' - inactivity warning' : ''}`);
        }
      } catch {
        setGitActivity('Unable to fetch commit activity');
      }
    }
    loadGitActivity();
  }, [selectedSubmission?.id]);

  const weightedTotal = rubricItems.reduce((sum, item) => {
    const val = scores[item.id] || 0;
    return sum + (val / item.maxScore) * item.weight;
  }, 0);

  async function handleSubmitScores() {
    if (!selectedSubmission || !selectedTeam) return;
    if (rubricItems.some((item) => scores[item.id] === undefined)) {
      setFeedback('All criteria must be scored');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        hackathonId,
        submissionId: selectedSubmission.id,
        scores: Object.entries(scores).map(([rubricItemId, score]) => ({ rubricItemId, score })),
        notes,
        seal,
      };
      const res = await fetch('/api/judge/submit-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback(data.error || 'Failed to save scores');
        return;
      }
      setFeedback(seal ? 'Scores sealed successfully' : 'Scores saved');
      setTeamRows((prev) => prev.map((t) => (t.id === selectedTeam.id ? { ...t, scored: true } : t)));
      if (selectedIndex < teamRows.length - 1) setSelectedIndex((i) => i + 1);
    } catch (error) {
      console.error('Failed to submit scores:', error);
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Judging Console</h1>
      {feedback && <div className="mb-4 p-3 bg-indigo-100 text-indigo-700 rounded">{feedback}</div>}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-1">
          <span>Progress</span>
          <span>{scoredCount}/{teamRows.length} ({progressPct}%)</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded">
          <div className="h-2 bg-indigo-600 rounded" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Submissions List */}
        <div className="col-span-1">
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Submissions</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {teamRows.map((team, idx) => (
                <button
                  key={team.id}
                  onClick={() => setSelectedIndex(idx)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedIndex === idx
                      ? 'bg-indigo-100 border-indigo-600 border'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <p className="font-medium text-gray-900">{team.name}</p>
                  <p className="text-sm text-gray-600">{team.scored ? 'Scored' : 'Pending'}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Scoring Panel */}
        <div className="col-span-2">
          {selectedSubmission ? (
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-4">{selectedTeam?.name}</h2>

              {/* Links */}
              <div className="mb-6 pb-6 border-b">
                {selectedSubmission.githubUrl && (
                  <div className="mb-2">
                    <a
                      href={selectedSubmission.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      GitHub Repository →
                    </a>
                  </div>
                )}
                {selectedSubmission.liveUrl && (
                  <div>
                    <a
                      href={selectedSubmission.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      Live Demo →
                    </a>
                  </div>
                )}
                <p className="text-sm text-gray-600 mt-2">{gitActivity}</p>
              </div>

              {/* Scoring */}
              <div className="space-y-4 mb-6">
                <h3 className="font-bold text-gray-900">Score Submission</h3>
                {rubricItems.map((item) => (
                  <div key={item.id}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {item.name} (0-{item.maxScore}, weight {item.weight}%)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max={item.maxScore}
                      step="1"
                      value={scores[item.id] ?? 0}
                      onChange={(e) =>
                        setScores({
                          ...scores,
                          [item.id]: parseFloat(e.target.value),
                        })
                      }
                      className="w-full"
                    />
                    <p className="text-xs text-gray-600">Score: {scores[item.id] ?? 0}</p>
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea className="input min-h-24" value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={seal} onChange={(e) => setSeal(e.target.checked)} />
                  Seal scores (irreversible)
                </label>
                <p className="text-sm font-semibold">Live weighted total: {weightedTotal.toFixed(2)}</p>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setSelectedIndex((i) => Math.max(0, i - 1))} className="btn btn-secondary flex-1" disabled={selectedIndex === 0}>
                  Previous Team
                </button>
                <button
                  onClick={handleSubmitScores}
                  disabled={isSaving || rubricItems.length === 0}
                  className="btn btn-primary flex-1"
                >
                  {isSaving ? 'Saving...' : seal ? 'Review & Seal Scores' : 'Save Scores'}
                </button>
                <button onClick={() => setSelectedIndex((i) => Math.min(teamRows.length - 1, i + 1))} className="btn btn-secondary flex-1" disabled={selectedIndex === teamRows.length - 1}>
                  Next Team
                </button>
              </div>
            </div>
          ) : (
            <div className="card text-center py-12">
              <p className="text-gray-600">Select a submission to score</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
