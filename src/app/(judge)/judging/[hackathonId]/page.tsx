'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';

interface Submission {
  id: string;
  status: string;
  githubUrl?: string;
  liveUrl?: string;
  description?: string;
  technologies: string[];
  team: { id: string; name: string; members: Array<any> };
  scores: Array<any>;
}

interface RubricItem {
  id: string;
  name: string;
  maxScore: number;
  weight: number;
  description?: string;
}

type EmbedMode = 'readme' | 'live' | 'none';

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
  const [gitActivity, setGitActivity] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [embedMode, setEmbedMode] = useState<EmbedMode>('none');
  const [iframeError, setIframeError] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [teamsRes, hackathonRes, rubricsRes] = await Promise.all([
          fetch(`/api/judge/teams?hackathonId=${hackathonId}`),
          fetch(`/api/hackathons/${hackathonId}`),
          fetch(`/api/hackathons/${hackathonId}/rubrics`),
        ]);
        const teamsData = await teamsRes.json();
        const hackathonData = await hackathonRes.json();
        const rubricsData = await rubricsRes.json();
        const rows = teamsData.data?.teams || [];
        setTeamRows(rows);
        setBlindMode(!!teamsData.data?.blindMode);
        const subMap: Record<string, Submission> = {};
        (hackathonData.data?.teams || []).forEach((team: any) => {
          if (team.submission) subMap[team.submission.id] = team.submission as Submission;
        });
        setSubmissions(subMap);
        // Get rubric items from the first rubric
        const rubrics = rubricsData.data || [];
        const rubricItems = rubrics.length > 0 ? (rubrics[0].items || []) : [];
        setRubricItems(rubricItems);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    if (hackathonId) fetchData();
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
          setGitActivity(`Last commit ${hrs}h ago${hrs > 72 ? ' — inactivity warning' : ''}`);
        }
      } catch {
        setGitActivity('Unable to fetch commit activity');
      }
    }
    loadGitActivity();
    setEmbedMode('none');
    setIframeError(false);
  }, [selectedSubmission?.id]);

  const weightedTotal = rubricItems.reduce((sum, item) => {
    const val = scores[item.id] || 0;
    return sum + (val / item.maxScore) * item.weight;
  }, 0);

  const allScored = rubricItems.every((item) => scores[item.id] !== undefined && scores[item.id] > 0);
  const notesValid = notes.trim().length > 0;

  const filteredTeams = useMemo(() => {
    if (!searchQuery.trim()) return teamRows.map((t, i) => ({ ...t, idx: i }));
    const q = searchQuery.toLowerCase();
    return teamRows
      .map((t, i) => ({ ...t, idx: i }))
      .filter((t) => t.name.toLowerCase().includes(q) || String(t.idx + 1).includes(q));
  }, [teamRows, searchQuery]);

  async function handleSubmitScores() {
    if (!selectedSubmission || !selectedTeam) return;
    if (rubricItems.some((item) => scores[item.id] === undefined)) {
      setFeedback('All criteria must be scored');
      return;
    }
    if (!notes.trim()) {
      setFeedback('Notes are required before submitting scores');
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
      if (!res.ok) { setFeedback(data.error || 'Failed to save scores'); return; }
      setFeedback(seal ? 'Scores sealed successfully' : 'Scores saved');
      setTeamRows((prev) => prev.map((t) => (t.id === selectedTeam.id ? { ...t, scored: true } : t)));
      setShowConfirm(false);
      if (selectedIndex < teamRows.length - 1) setSelectedIndex((i) => i + 1);
    } catch (err) {
      console.error('Failed to submit scores:', err);
    } finally {
      setIsSaving(false);
    }
  }

  async function selectTeam(idx: number) {
    setSelectedIndex(idx);
    setScores({});
    setNotes('');
    setSeal(false);
    setShowConfirm(false);
    setFeedback('');
    setEmbedMode('none');
    setIframeError(false);

    // Fetch existing scores for this team/submission for the current judge
    const team = teamRows[idx];
    if (!team?.submissionId) return;
    try {
      const res = await fetch(`/api/submissions/${team.submissionId}/scores`);
      if (!res.ok) return;
      const data = await res.json();
      // Get current judge's email from session (injected by backend on page load or via a prop, or fallback to first score)
      // For now, assume only the current judge's scores are returned, or filter by judge if needed
      const judgeEmail = null; // Optionally, get from session if available
      let judgeScores = data.data;
      // If multiple judges' scores are returned, filter by judge (if judge info is available)
      // judgeScores = judgeScores.filter((s: any) => s.judge?.email === judgeEmail);
      if (Array.isArray(judgeScores) && judgeScores.length > 0) {
        // Only use scores if they are not sealed (if sealed, do not allow editing)
        const notSealed = judgeScores.filter((s: any) => !s.isSealed);
        const useScores = notSealed.length > 0 ? notSealed : judgeScores;
        const scoresObj: Record<string, number> = {};
        useScores.forEach((s: any) => {
          scoresObj[s.rubricItemId] = s.score;
        });
        setScores(scoresObj);
        // Optionally, set notes if available (if you store notes per score, adjust as needed)
        if (useScores[0]?.comment) setNotes(useScores[0].comment);
        if (useScores[0]?.isSealed) setSeal(true);
      }
    } catch (err) {
      // Ignore errors, fallback to empty
    }
  }

  function getEmbedUrl(): string {
    if (embedMode === 'live' && selectedSubmission?.liveUrl) return selectedSubmission.liveUrl;
    if (embedMode === 'readme' && selectedSubmission?.githubUrl) {
      const match = selectedSubmission.githubUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
      if (match) return `https://github.com/${match[1]}/${match[2]}#readme`;
    }
    return '';
  }

  function getStatusDot(team: { scored: boolean; idx: number }) {
    if (team.scored) return 'judging-dot judging-dot--done';
    if (team.idx === selectedIndex) return 'judging-dot judging-dot--active';
    return 'judging-dot judging-dot--pending';
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-root)' }}>
        <div style={{ width: 28, height: 28, border: '2px solid var(--border-subtle)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'auth-spin 0.7s linear infinite' }} />
      </div>
    );
  }

  return (
    <div className="judging-shell">
      {/* ─── TOP BAR ─── */}
      <div className="judging-topbar">
        <div>
          <span className="judging-topbar__label">Judging Console</span>
          <span className="judging-topbar__mode">
            {blindMode ? '● Blind Mode' : '○ Open'} — {scoredCount}/{teamRows.length} scored
          </span>
        </div>
        <div className="judging-topbar__progress">
          <div className="judging-topbar__bar">
            <div className="judging-topbar__fill" style={{ width: `${progressPct}%` }} />
          </div>
          <span className="judging-topbar__pct">{progressPct}%</span>
        </div>
      </div>

      {feedback && (
        <div className={`judging-feedback ${feedback.includes('Seal') || feedback.includes('sealed') ? 'judging-feedback--warn' : 'judging-feedback--ok'}`}>
          {feedback}
        </div>
      )}

      {/* ─── THREE-COLUMN LAYOUT ─── */}
      <div className="judging-layout">

        {/* ═══ COL 1: QUEUE SIDEBAR ═══ */}
        <div className="judging-queue">
          <div className="judging-queue__header">
            <span className="judging-queue__title">Queue</span>
            <span className="judging-queue__count">{scoredCount}/{teamRows.length}</span>
          </div>
          <div className="judging-queue__search-wrap">
            <svg className="judging-queue__search-icon" viewBox="0 0 20 20" fill="none">
              <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M13 13l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input
              className="judging-queue__search"
              placeholder="Search team or #"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="judging-queue__list">
            {filteredTeams.map((team) => (
              <button
                key={team.id}
                onClick={() => selectTeam(team.idx)}
                className={`judging-queue__item ${team.idx === selectedIndex ? 'judging-queue__item--active' : ''}`}
              >
                <span className={getStatusDot(team)} />
                <span className="judging-queue__item-name">
                  {blindMode ? `Team ${team.idx + 1}` : team.name}
                </span>
              </button>
            ))}
            {filteredTeams.length === 0 && (
              <p className="judging-queue__empty">No teams found</p>
            )}
          </div>
        </div>

        {/* ═══ COL 2: EVIDENCE PANE ═══ */}
        <div className="judging-evidence">
          {selectedSubmission ? (
            <>
              {/* Project Header */}
              <div className="judging-evidence__header">
                <div>
                  <p className="judging-evidence__team-label">
                    {blindMode ? `Team ${selectedIndex + 1}` : selectedTeam?.name}
                  </p>
                  <p className="judging-evidence__tech">
                    {selectedSubmission.technologies?.join(' · ') || 'No tech stack listed'}
                  </p>
                  {selectedSubmission.description && (
                    <div className="judging-evidence__desc">
                      <span style={{ display: 'block', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>Work Done So Far</span>
                      <p>{selectedSubmission.description}</p>
                    </div>
                  )}
                  {gitActivity && (
                    <span className={`judging-activity-tag ${gitActivity.includes('warning') ? 'judging-activity-tag--warn' : 'judging-activity-tag--ok'}`}>
                      <span className="judging-activity-tag__dot" />
                      {gitActivity}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Bar */}
              <div className="judging-evidence__actions">
                {selectedSubmission.liveUrl && (
                  <button
                    className={`judging-action-btn judging-action-btn--live ${embedMode === 'live' ? 'judging-action-btn--active' : ''}`}
                    onClick={() => {
                      setEmbedMode(embedMode === 'live' ? 'none' : 'live');
                      setIframeError(false);
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
                    </svg>
                    {embedMode === 'live' ? 'Hide' : 'Open Live Demo'}
                  </button>
                )}
                {selectedSubmission.githubUrl && (
                  <button
                    className={`judging-action-btn judging-action-btn--gh ${embedMode === 'readme' ? 'judging-action-btn--active' : ''}`}
                    onClick={() => {
                      setEmbedMode(embedMode === 'readme' ? 'none' : 'readme');
                      setIframeError(false);
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    {embedMode === 'readme' ? 'Hide Readme' : 'View Source Code'}
                  </button>
                )}
                {selectedSubmission.liveUrl && (
                  <a href={selectedSubmission.liveUrl} target="_blank" rel="noopener noreferrer" className="judging-action-btn judging-action-btn--ext">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/>
                    </svg>
                    External
                  </a>
                )}
              </div>

              {/* Embedded View */}
              {embedMode !== 'none' && (
                <div className="judging-embed">
                  {iframeError ? (
                    <div className="judging-embed__error">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
                      </svg>
                      <p>This page can't be embedded (X-Frame-Options blocked).</p>
                      <a href={getEmbedUrl()} target="_blank" rel="noopener noreferrer" className="judging-embed__open-link">
                        Open in new tab →
                      </a>
                    </div>
                  ) : (
                    <iframe
                      key={embedMode + selectedSubmission.id}
                      src={getEmbedUrl()}
                      className="judging-embed__frame"
                      onError={() => setIframeError(true)}
                      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                      title={embedMode === 'live' ? 'Live Demo' : 'GitHub Readme'}
                    />
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="judging-evidence__empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 12h6M12 9v6"/>
              </svg>
              <p>Select a team from the queue to begin</p>
            </div>
          )}
        </div>

        {/* ═══ COL 3: VERDICT PANE ═══ */}
        <div className="judging-verdict">
          <div className="judging-verdict__inner">
            {selectedSubmission ? (
              <>
                <div className="judging-verdict__header">
                  <span className="judging-verdict__title">Evaluation</span>
                </div>

                {/* Rubrics Section */}
                {rubricItems.length > 0 && (
                  <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-muted)', marginBottom: '1rem' }}>
                      Rubric Criteria
                    </h3>
                    <div className="judging-rubric">
                      {rubricItems.map((item) => (
                        <div key={item.id} className="judging-rubric__card">
                          <div className="judging-rubric__row">
                            <div>
                              <p className="judging-rubric__name">{item.name}</p>
                              <p className="judging-rubric__weight">Weight: {item.weight}%</p>
                            </div>
                          </div>
                          {item.description && (
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                              {item.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Marks Input Section */}
                <div>
                  <h3 style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    Enter Marks
                  </h3>
                  
                  <div className="judging-rubric">
                    {rubricItems.map((item) => {
                      const cur = scores[item.id] ?? 0;
                      return (
                        <div key={item.id} className="judging-rubric__card">
                          <div className="judging-rubric__row">
                            <div>
                              <p className="judging-rubric__name">{item.name}</p>
                            </div>
                            <div className="judging-rubric__score">
                              <input
                                type="number"
                                min={0}
                                max={item.maxScore}
                                value={cur}
                                onChange={(e) => {
                                  let val = parseFloat(e.target.value);
                                  if (isNaN(val)) val = 0;
                                  if (val < 0) val = 0;
                                  if (val > item.maxScore) val = item.maxScore;
                                  setScores({ ...scores, [item.id]: val });
                                }}
                                style={{ width: 60, fontSize: '1.1rem', fontWeight: 600, textAlign: 'right', marginRight: 4 , color: 'black'}}
                              />
                              <span className="judging-rubric__score-max">/ {item.maxScore}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Weighted Total */}
                  {rubricItems.length > 0 && (
                    <div className="judging-score-total" style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div>
                        <span className="judging-score-total__label">Total Marks Obtained: </span>
                        <span className="judging-score-total__value">
                          {rubricItems.reduce((sum, item) => sum + (scores[item.id] ?? 0), 0)}
                        </span>
                        <span className="judging-score-total__max">/ {rubricItems.reduce((sum, item) => sum + item.maxScore, 0)}</span>
                      </div>
                      {/* <div>
                        <span className="judging-score-total__label">Weighted Total: </span>
                        <span className="judging-score-total__value">{weightedTotal.toFixed(2)}</span>
                        <span className="judging-score-total__max">/ 100</span>
                      </div> */}
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div className="judging-notes" style={{ marginTop: '2rem' }}>
                  <div className="judging-notes__label-row">
                    <label className="judging-notes__label">Evaluation Notes <span style={{ color: 'var(--error)' }}>*</span></label>
                    {!notesValid && notes.length === 0 && (
                      <span className="judging-notes__hint">Required for anti-bias audit</span>
                    )}
                  </div>
                  <textarea
                    className={`judging-notes__textarea ${notesValid ? '' : 'judging-notes__textarea--error'}`}
                    placeholder="Explain your scoring rationale…"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                {/* Actions */}
                <div className="judging-actions">
                  <button
                    onClick={() => selectTeam(Math.max(0, selectedIndex - 1))}
                    disabled={selectedIndex === 0}
                    className="judging-nav-btn"
                  >← Prev</button>

                  {!seal ? (
                    <button
                      onClick={() => {
                        if (!allScored) { setFeedback('All criteria must be scored'); return; }
                        if (!notesValid) { setFeedback('Notes are required before saving'); return; }
                        handleSubmitScores();
                      }}
                      disabled={isSaving || rubricItems.length === 0}
                      className="judging-save-btn"
                    >
                      {isSaving ? 'Saving…' : 'Save Scores'}
                    </button>
                  ) : (
                    <button
                      onClick={() => { if (allScored && notesValid) setShowConfirm(true); }}
                      disabled={isSaving || !allScored || !notesValid}
                      className="judging-seal-btn"
                    >
                      {isSaving ? 'Sealing…' : 'Review & Seal'}
                    </button>
                  )}

                  <button
                    onClick={() => selectTeam(Math.min(teamRows.length - 1, selectedIndex + 1))}
                    disabled={selectedIndex === teamRows.length - 1}
                    className="judging-nav-btn"
                  >Next →</button>
                </div>

                {/* Seal toggle */}
                <label className="judging-seal-toggle">
                  <div
                    onClick={() => setSeal(!seal)}
                    className={`judging-seal-toggle__track ${seal ? 'judging-seal-toggle__track--on' : ''}`}
                  >
                    <div className={`judging-seal-toggle__thumb ${seal ? 'judging-seal-toggle__thumb--on' : ''}`} />
                  </div>
                  <span className="judging-seal-toggle__label">
                    Seal scores after saving <span style={{ color: 'var(--text-muted)' }}>(irreversible)</span>
                  </span>
                </label>
              </>
            ) : (
              <div className="judging-verdict__empty">
                Select a team to score
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── SEAL CONFIRM MODAL ─── */}
      {showConfirm && selectedSubmission && (
        <div className="judging-modal-overlay">
          <div className="judging-modal">
            <h2 className="judging-modal__title">Confirm & Seal Scores</h2>
            <p className="judging-modal__sub">This action is irreversible. Scores will be locked permanently.</p>
            <div className="judging-modal__scores">
              {rubricItems.map((item) => (
                <div key={item.id} className="judging-modal__score-row">
                  <span>{item.name}</span>
                  <span className="judging-modal__score-val">{scores[item.id] ?? 0}/{item.maxScore}</span>
                </div>
              ))}
              <div className="judging-modal__score-row judging-modal__score-row--total">
                <span>Weighted Total</span>
                <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-display)' }}>{weightedTotal.toFixed(2)}</span>
              </div>
            </div>
            <div className="judging-modal__notes">
              <p className="org-label" style={{ marginBottom: '0.4rem' }}>Notes</p>
              <p className="judging-modal__notes-text">{notes}</p>
            </div>
            <div className="judging-modal__actions">
              <button onClick={() => setShowConfirm(false)} className="judging-nav-btn" style={{ flex: 1 }}>Cancel</button>
              <button onClick={handleSubmitScores} disabled={isSaving} className="judging-seal-btn" style={{ flex: 1 }}>
                {isSaving ? 'Sealing…' : 'Confirm & Seal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
