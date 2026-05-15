'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, BarChart3, CheckCircle, Download, FileText, RefreshCw, Users } from 'lucide-react';

type CountRow = { label: string; count: number };
type AverageRow = { label: string; average: number; count: number };
type ScoreSpreadRow = {
  teamId: string;
  teamName: string;
  track: string;
  scoresCount: number;
  minScore: number;
  maxScore: number;
  averageScore: number;
  totalScore: number;
};
type TrackRow = { label: string; participants: number; teams: number; submissions: number };
type Category = 'demographics' | 'tracks' | 'winners' | 'quality' | 'scores' | 'registrations';
type CountChart = 'bar' | 'column' | 'pie' | 'donut' | 'table' | 'pills';
type AverageChart = 'bar' | 'column' | 'table' | 'pills';
type ScoreChart = 'spread' | 'table';

interface Stats {
  totalTeams: number;
  participantsCount: number;
  submittedCount: number;
  healthyCount: number;
  openTickets: number;
  totalAttendances: number;
  averageTeamSize: number;
  averageScore: number;
  postHackathon?: {
    winnersByTrack: CountRow[];
    winnersByDomain: CountRow[];
    winnersByCollege: CountRow[];
    genderDistribution: CountRow[];
    locationDistribution: CountRow[];
    domainDistribution: CountRow[];
    collegeDistribution: CountRow[];
  };
  trackAnalytics?: {
    participantsPerTrack: CountRow[];
    teamsPerTrack: CountRow[];
    submissionsPerTrack: CountRow[];
    highestParticipation: CountRow | null;
    lowestParticipation: CountRow | null;
  };
  qualityAnalytics?: {
    averageScoreByDomain: AverageRow[];
    averageScoreByCollege: AverageRow[];
    averageScoreByTrack: AverageRow[];
    highestPerformingTechnologyStacks: AverageRow[];
    scoreSpreadPerTeam: ScoreSpreadRow[];
  };
}

interface Props {
  hackathonId: string;
}

const COLORS = ['#0969da', '#1a7f37', '#8250df', '#bf8700', '#cf222e', '#0a7ea4', '#57606a', '#6f42c1'];

function csvEscape(value: string | number | null | undefined) {
  const text = String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
}

function downloadCsv(filename: string, headers: string[], rows: Array<Array<string | number | null | undefined>>) {
  const csv = [headers.map(csvEscape).join(','), ...rows.map((row) => row.map(csvEscape).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function EmptyState({ label }: { label: string }) {
  return <p className="org-text" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{label}</p>;
}

function FilterButton({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={active ? 'org-btn-primary' : 'org-btn-secondary'}
      style={{ minHeight: 34, padding: '0.45rem 0.7rem', fontSize: '0.78rem' }}
    >
      {children}
    </button>
  );
}

function applyRowFilters<T extends { label: string }>(rows: T[], query: string, topN: number) {
  const q = query.trim().toLowerCase();
  return rows
    .filter((row) => !q || row.label.toLowerCase().includes(q))
    .slice(0, topN);
}

function CountVisual({ rows, mode }: { rows: CountRow[]; mode: CountChart }) {
  if (rows.length === 0) return <EmptyState label="No data for this filter" />;
  const max = Math.max(1, ...rows.map((row) => row.count));
  const total = rows.reduce((sum, row) => sum + row.count, 0);

  if (mode === 'table') {
    return (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)', textAlign: 'left' }}>
              <th style={{ padding: '0.55rem 0.4rem' }}>Group</th>
              <th style={{ padding: '0.55rem 0.4rem', textAlign: 'right' }}>Count</th>
              <th style={{ padding: '0.55rem 0.4rem', textAlign: 'right' }}>Share</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '0.6rem 0.4rem', fontWeight: 600, color: 'var(--text-primary)' }}>{row.label}</td>
                <td style={{ padding: '0.6rem 0.4rem', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{row.count}</td>
                <td style={{ padding: '0.6rem 0.4rem', textAlign: 'right', color: 'var(--text-secondary)' }}>{total ? Math.round((row.count / total) * 100) : 0}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (mode === 'donut') {
    let offset = 25;
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[220px_1fr]">
        <svg viewBox="0 0 42 42" style={{ width: 210, height: 210, margin: '0 auto' }} role="img" aria-label="Donut chart">
          <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="var(--bg-raised)" strokeWidth="6" />
          {rows.map((row, index) => {
            const percent = total > 0 ? (row.count / total) * 100 : 0;
            const circle = (
              <circle
                key={row.label}
                cx="21"
                cy="21"
                r="15.915"
                fill="transparent"
                stroke={COLORS[index % COLORS.length]}
                strokeWidth="6"
                strokeDasharray={`${percent} ${100 - percent}`}
                strokeDashoffset={offset}
              />
            );
            offset -= percent;
            return circle;
          })}
          <text x="21" y="20" textAnchor="middle" style={{ fontSize: 4, fontWeight: 700, fill: 'var(--text-primary)' }}>{total}</text>
          <text x="21" y="25" textAnchor="middle" style={{ fontSize: 2.4, fill: 'var(--text-muted)' }}>total</text>
        </svg>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center' }}>
          {rows.map((row, index) => (
            <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: COLORS[index % COLORS.length], flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)', fontWeight: 600 }}>{row.label}</span>
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{row.count}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (mode === 'pie') {
    let cumulative = 0;
    const segments = rows.map((row, index) => {
      const value = total > 0 ? row.count / total : 0;
      const start = cumulative;
      cumulative += value;
      return {
        row,
        color: COLORS[index % COLORS.length],
        start,
        end: cumulative,
      };
    });
    const point = (ratio: number) => {
      const angle = ratio * Math.PI * 2 - Math.PI / 2;
      return [21 + Math.cos(angle) * 18, 21 + Math.sin(angle) * 18];
    };

    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[220px_1fr]">
        <svg viewBox="0 0 42 42" style={{ width: 210, height: 210, margin: '0 auto' }} role="img" aria-label="Pie chart">
          {segments.map(({ row, color, start, end }) => {
            const [sx, sy] = point(start);
            const [ex, ey] = point(end);
            const largeArc = end - start > 0.5 ? 1 : 0;
            if (end - start >= 0.9999) {
              return <circle key={row.label} cx="21" cy="21" r="18" fill={color} />;
            }
            return (
              <path
                key={row.label}
                d={`M 21 21 L ${sx} ${sy} A 18 18 0 ${largeArc} 1 ${ex} ${ey} Z`}
                fill={color}
              />
            );
          })}
        </svg>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center' }}>
          {rows.map((row, index) => (
            <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: COLORS[index % COLORS.length], flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)', fontWeight: 600 }}>{row.label}</span>
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{total ? Math.round((row.count / total) * 100) : 0}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (mode === 'column') {
    return (
      <div style={{ overflowX: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'end', gap: 12, minHeight: 240, minWidth: Math.max(420, rows.length * 72), padding: '0.75rem 0.25rem 0' }}>
          {rows.map((row, index) => {
            const height = Math.max(8, (row.count / max) * 170);
            return (
              <div key={row.label} style={{ flex: '1 0 56px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>{row.count}</span>
                <div style={{ width: '100%', maxWidth: 42, height, borderRadius: '7px 7px 3px 3px', background: COLORS[index % COLORS.length] }} />
                <span title={row.label} style={{ maxWidth: 70, minHeight: 34, overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center', color: 'var(--text-primary)', fontSize: '0.72rem', fontWeight: 650, lineHeight: 1.15 }}>
                  {row.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (mode === 'pills') {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {rows.map((row, index) => (
          <span key={row.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid var(--border-default)', borderRadius: 8, padding: '0.45rem 0.65rem', background: 'var(--bg-raised)' }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: COLORS[index % COLORS.length] }} />
            <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{row.label}</span>
            <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{row.count}</span>
          </span>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {rows.map((row, index) => (
        <div key={row.label} style={{ display: 'grid', gridTemplateColumns: 'minmax(110px,0.8fr) minmax(120px,2fr) 48px', gap: 10, alignItems: 'center' }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 650, color: 'var(--text-primary)' }}>{row.label}</span>
          <div style={{ height: 12, borderRadius: 7, background: 'var(--bg-raised)', overflow: 'hidden' }}>
            <div style={{ width: `${(row.count / max) * 100}%`, height: '100%', background: COLORS[index % COLORS.length], borderRadius: 7 }} />
          </div>
          <span style={{ textAlign: 'right', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{row.count}</span>
        </div>
      ))}
    </div>
  );
}

function AverageVisual({ rows, mode }: { rows: AverageRow[]; mode: AverageChart }) {
  if (rows.length === 0) return <EmptyState label="No scored data for this filter" />;
  const max = Math.max(1, ...rows.map((row) => row.average));

  if (mode === 'table') {
    return (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)', textAlign: 'left' }}>
              <th style={{ padding: '0.55rem 0.4rem' }}>Group</th>
              <th style={{ padding: '0.55rem 0.4rem', textAlign: 'right' }}>Average</th>
              <th style={{ padding: '0.55rem 0.4rem', textAlign: 'right' }}>Teams</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '0.6rem 0.4rem', color: 'var(--text-primary)', fontWeight: 600 }}>{row.label}</td>
                <td style={{ padding: '0.6rem 0.4rem', textAlign: 'right', color: '#0969da', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{row.average.toFixed(2)}</td>
                <td style={{ padding: '0.6rem 0.4rem', textAlign: 'right', color: 'var(--text-secondary)' }}>{row.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (mode === 'pills') {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((row, index) => (
          <div key={row.label} style={{ border: '1px solid var(--border-default)', borderRadius: 8, background: 'var(--bg-raised)', padding: '0.75rem', borderLeft: `3px solid ${COLORS[index % COLORS.length]}` }}>
            <p style={{ color: 'var(--text-primary)', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.label}</p>
            <p style={{ marginTop: 6, color: COLORS[index % COLORS.length], fontFamily: 'var(--font-mono)', fontSize: '1.15rem', fontWeight: 800 }}>{row.average.toFixed(2)}</p>
            <p className="org-text">{row.count} scored team{row.count === 1 ? '' : 's'}</p>
          </div>
        ))}
      </div>
    );
  }

  if (mode === 'column') {
    return (
      <div style={{ overflowX: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'end', gap: 12, minHeight: 240, minWidth: Math.max(420, rows.length * 72), padding: '0.75rem 0.25rem 0' }}>
          {rows.map((row, index) => {
            const height = Math.max(8, (row.average / max) * 170);
            return (
              <div key={row.label} style={{ flex: '1 0 56px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#0969da', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 700 }}>{row.average.toFixed(1)}</span>
                <div style={{ width: '100%', maxWidth: 42, height, borderRadius: '7px 7px 3px 3px', background: COLORS[index % COLORS.length] }} />
                <span title={row.label} style={{ maxWidth: 70, minHeight: 34, overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center', color: 'var(--text-primary)', fontSize: '0.72rem', fontWeight: 650, lineHeight: 1.15 }}>
                  {row.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {rows.map((row, index) => (
        <div key={row.label} style={{ display: 'grid', gridTemplateColumns: 'minmax(120px,0.9fr) minmax(130px,2fr) 64px', gap: 10, alignItems: 'center' }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 650, color: 'var(--text-primary)' }}>{row.label}</span>
          <div style={{ height: 12, borderRadius: 7, background: 'var(--bg-raised)', overflow: 'hidden' }}>
            <div style={{ width: `${(row.average / max) * 100}%`, height: '100%', background: COLORS[index % COLORS.length], borderRadius: 7 }} />
          </div>
          <span style={{ textAlign: 'right', color: '#0969da', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 700 }}>{row.average.toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}

function TrackVisual({ rows, mode }: { rows: TrackRow[]; mode: CountChart }) {
  if (rows.length === 0) return <EmptyState label="No track data for this filter" />;
  if (mode === 'table') {
    return (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)', textAlign: 'left' }}>
              <th style={{ padding: '0.55rem 0.4rem' }}>Track</th>
              <th style={{ padding: '0.55rem 0.4rem', textAlign: 'right' }}>Participants</th>
              <th style={{ padding: '0.55rem 0.4rem', textAlign: 'right' }}>Teams</th>
              <th style={{ padding: '0.55rem 0.4rem', textAlign: 'right' }}>Submissions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '0.6rem 0.4rem', color: 'var(--text-primary)', fontWeight: 700 }}>{row.label}</td>
                <td style={{ padding: '0.6rem 0.4rem', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{row.participants}</td>
                <td style={{ padding: '0.6rem 0.4rem', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{row.teams}</td>
                <td style={{ padding: '0.6rem 0.4rem', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{row.submissions}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {rows.map((row) => {
        const max = Math.max(1, row.participants, row.teams, row.submissions);
        return (
          <div key={row.label} style={{ border: '1px solid var(--border-default)', borderRadius: 8, background: 'var(--bg-raised)', padding: '0.75rem' }}>
            <p style={{ marginBottom: 8, color: 'var(--text-primary)', fontWeight: 800 }}>{row.label}</p>
            {[
              ['Participants', row.participants, '#0969da'],
              ['Teams', row.teams, '#1a7f37'],
              ['Submissions', row.submissions, '#8250df'],
            ].map(([name, value, color]) => (
              <div key={name} style={{ display: 'grid', gridTemplateColumns: '95px 1fr 42px', gap: 8, alignItems: 'center', marginTop: 6 }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>{name}</span>
                <div style={{ height: 8, borderRadius: 6, background: 'var(--bg-root)', overflow: 'hidden' }}>
                  <div style={{ width: `${(Number(value) / max) * 100}%`, height: '100%', background: String(color), borderRadius: 6 }} />
                </div>
                <span style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>{value}</span>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function ScoreSpreadVisual({ rows, mode }: { rows: ScoreSpreadRow[]; mode: ScoreChart }) {
  if (rows.length === 0) return <EmptyState label="No scored teams for this filter" />;
  if (mode === 'table') {
    return (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)', textAlign: 'left' }}>
              <th style={{ padding: '0.55rem 0.4rem' }}>Team</th>
              <th style={{ padding: '0.55rem 0.4rem' }}>Track</th>
              <th style={{ padding: '0.55rem 0.4rem', textAlign: 'right' }}>Min</th>
              <th style={{ padding: '0.55rem 0.4rem', textAlign: 'right' }}>Avg</th>
              <th style={{ padding: '0.55rem 0.4rem', textAlign: 'right' }}>Max</th>
              <th style={{ padding: '0.55rem 0.4rem', textAlign: 'right' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.teamId} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '0.6rem 0.4rem', color: 'var(--text-primary)', fontWeight: 700 }}>{row.teamName}</td>
                <td style={{ padding: '0.6rem 0.4rem', color: 'var(--text-secondary)' }}>{row.track}</td>
                <td style={{ padding: '0.6rem 0.4rem', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{row.minScore.toFixed(2)}</td>
                <td style={{ padding: '0.6rem 0.4rem', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{row.averageScore.toFixed(2)}</td>
                <td style={{ padding: '0.6rem 0.4rem', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{row.maxScore.toFixed(2)}</td>
                <td style={{ padding: '0.6rem 0.4rem', textAlign: 'right', color: '#0969da', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>{row.totalScore.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {rows.map((row) => {
        const width = row.maxScore > 0 ? Math.max(4, (row.averageScore / row.maxScore) * 100) : 0;
        return (
          <div key={row.teamId} style={{ padding: '0.75rem', borderRadius: 8, border: '1px solid var(--border-default)', background: 'var(--bg-raised)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ color: 'var(--text-primary)', fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.teamName}</p>
                <p className="org-text">{row.track} - {row.scoresCount} scores</p>
              </div>
              <span style={{ color: '#0969da', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>{row.totalScore.toFixed(2)}</span>
            </div>
            <div style={{ height: 10, borderRadius: 7, background: 'var(--bg-root)', overflow: 'hidden' }}>
              <div style={{ width: `${width}%`, height: '100%', borderRadius: 7, background: '#8250df' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, color: 'var(--text-muted)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
              <span>Min {row.minScore.toFixed(2)}</span>
              <span>Avg {row.averageScore.toFixed(2)}</span>
              <span>Max {row.maxScore.toFixed(2)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AnalyticsDashboard({ hackathonId }: Props) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<Category>('tracks');
  const [metric, setMetric] = useState('participantsPerTrack');
  const [countChart, setCountChart] = useState<CountChart>('bar');
  const [averageChart, setAverageChart] = useState<AverageChart>('bar');
  const [scoreChart, setScoreChart] = useState<ScoreChart>('spread');
  const [topN, setTopN] = useState(10);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!hackathonId) return;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/hackathons/${hackathonId}/stats`, { credentials: 'include' });
        setStats((await res.json()).data || null);
      } catch {
        setStats(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [hackathonId]);

  const trackRows = useMemo(() => {
    const participantMap = new Map((stats?.trackAnalytics?.participantsPerTrack || []).map((row) => [row.label, row.count]));
    const teamMap = new Map((stats?.trackAnalytics?.teamsPerTrack || []).map((row) => [row.label, row.count]));
    const submissionMap = new Map((stats?.trackAnalytics?.submissionsPerTrack || []).map((row) => [row.label, row.count]));
    return Array.from(new Set([...participantMap.keys(), ...teamMap.keys(), ...submissionMap.keys()]))
      .sort((a, b) => (participantMap.get(b) || 0) - (participantMap.get(a) || 0) || a.localeCompare(b))
      .map((name) => ({
        label: name,
        participants: participantMap.get(name) || 0,
        teams: teamMap.get(name) || 0,
        submissions: submissionMap.get(name) || 0,
      }));
  }, [stats]);

  const metricOptions = useMemo(() => {
    const options: Record<Category, Array<{ value: string; label: string }>> = {
      demographics: [
        { value: 'genderDistribution', label: 'Gender distribution' },
        { value: 'locationDistribution', label: 'Location distribution' },
      ],
      tracks: [
        { value: 'participantsPerTrack', label: 'Participants per track' },
        { value: 'teamsPerTrack', label: 'Teams per track' },
        { value: 'submissionsPerTrack', label: 'Submissions per track' },
        { value: 'trackComparison', label: 'Track comparison' },
      ],
      winners: [
        { value: 'winnersByTrack', label: 'Winners by track' },
        { value: 'winnersByDomain', label: 'Winners by domain' },
        { value: 'winnersByCollege', label: 'Winners by college' },
      ],
      quality: [
        { value: 'averageScoreByDomain', label: 'Average score by domain' },
        { value: 'averageScoreByCollege', label: 'Average score by college' },
        { value: 'averageScoreByTrack', label: 'Average score by track' },
        { value: 'highestPerformingTechnologyStacks', label: 'Technology stacks' },
      ],
      scores: [
        { value: 'scoreSpreadPerTeam', label: 'Score spread per team' },
      ],
      registrations: [
        { value: 'domainDistribution', label: 'Registrations by domain' },
        { value: 'collegeDistribution', label: 'Registrations by college' },
      ],
    };
    return options[category];
  }, [category]);

  useEffect(() => {
    if (!metricOptions.some((option) => option.value === metric)) {
      setMetric(metricOptions[0]?.value || '');
    }
  }, [metricOptions, metric]);

  useEffect(() => {
    if (metric === 'trackComparison' && countChart !== 'bar' && countChart !== 'table') {
      setCountChart('bar');
    }
  }, [metric, countChart]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
        <RefreshCw style={{ width: 24, height: 24, color: 'var(--text-muted)', animation: 'auth-spin 0.8s linear infinite' }} />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="org-empty">
        <BarChart3 style={{ width: 32, height: 32, margin: '0 auto 0.75rem', opacity: 0.4 }} />
        <p>No analytics data available</p>
      </div>
    );
  }

  const statCards = [
    { label: 'Teams', value: stats.totalTeams, icon: Users, color: '#0969da' },
    { label: 'Participants', value: stats.participantsCount, icon: Users, color: '#1a7f37' },
    { label: 'Submissions', value: stats.submittedCount, icon: FileText, color: '#8250df' },
    { label: 'Healthy submissions', value: stats.healthyCount, icon: CheckCircle, color: '#1a7f37' },
    { label: 'Open tickets', value: stats.openTickets, icon: AlertCircle, color: '#bf8700' },
    { label: 'Check-ins', value: stats.totalAttendances, icon: Users, color: '#0969da' },
  ];

  const countSource: Record<string, CountRow[]> = {
    genderDistribution: stats.postHackathon?.genderDistribution || [],
    locationDistribution: stats.postHackathon?.locationDistribution || [],
    participantsPerTrack: stats.trackAnalytics?.participantsPerTrack || [],
    teamsPerTrack: stats.trackAnalytics?.teamsPerTrack || [],
    submissionsPerTrack: stats.trackAnalytics?.submissionsPerTrack || [],
    winnersByTrack: stats.postHackathon?.winnersByTrack || [],
    winnersByDomain: stats.postHackathon?.winnersByDomain || [],
    winnersByCollege: stats.postHackathon?.winnersByCollege || [],
    domainDistribution: stats.postHackathon?.domainDistribution || [],
    collegeDistribution: stats.postHackathon?.collegeDistribution || [],
  };
  const averageSource: Record<string, AverageRow[]> = {
    averageScoreByDomain: stats.qualityAnalytics?.averageScoreByDomain || [],
    averageScoreByCollege: stats.qualityAnalytics?.averageScoreByCollege || [],
    averageScoreByTrack: stats.qualityAnalytics?.averageScoreByTrack || [],
    highestPerformingTechnologyStacks: stats.qualityAnalytics?.highestPerformingTechnologyStacks || [],
  };
  const scoreRows = (stats.qualityAnalytics?.scoreSpreadPerTeam || [])
    .filter((row) => !query.trim() || `${row.teamName} ${row.track}`.toLowerCase().includes(query.trim().toLowerCase()))
    .slice(0, topN);
  const filteredCountRows = applyRowFilters(countSource[metric] || [], query, topN);
  const filteredAverageRows = applyRowFilters(averageSource[metric] || [], query, topN);
  const filteredTrackRows = applyRowFilters(trackRows, query, topN);
  const activeMetricLabel = metricOptions.find((option) => option.value === metric)?.label || 'Analytics';
  const countChartOptions: CountChart[] = metric === 'trackComparison' ? ['bar', 'table'] : ['bar', 'column', 'pie', 'donut', 'pills', 'table'];

  const renderVisual = () => {
    if (metric === 'trackComparison') return <TrackVisual rows={filteredTrackRows} mode={countChart} />;
    if (category === 'quality') return <AverageVisual rows={filteredAverageRows} mode={averageChart} />;
    if (category === 'scores') return <ScoreSpreadVisual rows={scoreRows} mode={scoreChart} />;
    return <CountVisual rows={filteredCountRows} mode={countChart} />;
  };

  const exportActive = () => {
    const baseName = activeMetricLabel.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'analytics';
    if (metric === 'trackComparison') {
      downloadCsv(`${baseName}.csv`, ['Track', 'Participants', 'Teams', 'Submissions'], filteredTrackRows.map((row) => [row.label, row.participants, row.teams, row.submissions]));
      return;
    }
    if (category === 'quality') {
      downloadCsv(`${baseName}.csv`, ['Group', 'Average score', 'Teams'], filteredAverageRows.map((row) => [row.label, row.average, row.count]));
      return;
    }
    if (category === 'scores') {
      downloadCsv(`${baseName}.csv`, ['Team', 'Track', 'Score count', 'Min score', 'Max score', 'Average score', 'Total score'], scoreRows.map((row) => [row.teamName, row.track, row.scoresCount, row.minScore, row.maxScore, row.averageScore, row.totalScore]));
      return;
    }
    downloadCsv(`${baseName}.csv`, ['Group', 'Count'], filteredCountRows.map((row) => [row.label, row.count]));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {statCards.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="org-section" style={{ borderLeft: `3px solid ${item.color}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Icon style={{ width: 15, height: 15, color: item.color }} aria-hidden />
                <span className="org-label">{item.label}</span>
              </div>
              <p className="org-value" style={{ color: item.color }}>{item.value}</p>
            </div>
          );
        })}
      </div>

      <div className="org-section">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
          <div>
            <p className="org-label">Analytics Filters</p>
            <p className="org-text">Choose one analytics slice, chart style, and export the filtered view.</p>
          </div>
          <button type="button" className="org-btn-secondary" onClick={exportActive} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Download style={{ width: 14, height: 14 }} aria-hidden />
            Export CSV
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          {[
            ['tracks', 'Tracks'],
            ['demographics', 'Demographics'],
            ['registrations', 'Registrations'],
            ['winners', 'Winners'],
            ['quality', 'Quality'],
            ['scores', 'Score Spread'],
          ].map(([value, name]) => (
            <FilterButton key={value} active={category === value} onClick={() => { setCategory(value as Category); setQuery(''); }}>
              {name}
            </FilterButton>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.2fr_1fr_120px]">
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span className="org-label">Metric</span>
            <select className="cc-select" value={metric} onChange={(event) => setMetric(event.target.value)}>
              {metricOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span className="org-label">Search filter</span>
            <input className="cc-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Track, college, domain, team..." />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span className="org-label">Top</span>
            <select className="cc-select" value={topN} onChange={(event) => setTopN(Number(event.target.value))}>
              {[5, 10, 15, 20, 50].map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
          {category === 'quality' ? (
            <>
              {(['bar', 'column', 'pills', 'table'] as AverageChart[]).map((mode) => (
                <FilterButton key={mode} active={averageChart === mode} onClick={() => setAverageChart(mode)}>{mode}</FilterButton>
              ))}
            </>
          ) : category === 'scores' ? (
            <>
              {(['spread', 'table'] as ScoreChart[]).map((mode) => (
                <FilterButton key={mode} active={scoreChart === mode} onClick={() => setScoreChart(mode)}>{mode}</FilterButton>
              ))}
            </>
          ) : (
            <>
              {countChartOptions.map((mode) => (
                <FilterButton key={mode} active={countChart === mode} onClick={() => setCountChart(mode)}>{mode}</FilterButton>
              ))}
            </>
          )}
        </div>
      </div>

      <div className="org-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
          <div>
            <p className="org-label" style={{ marginBottom: 4 }}>{activeMetricLabel}</p>
            {category === 'tracks' && (
              <p className="org-text">
                Highest: {stats.trackAnalytics?.highestParticipation?.label || 'n/a'} ({stats.trackAnalytics?.highestParticipation?.count || 0}) - Lowest: {stats.trackAnalytics?.lowestParticipation?.label || 'n/a'} ({stats.trackAnalytics?.lowestParticipation?.count || 0})
              </p>
            )}
          </div>
          <span style={{ alignSelf: 'flex-start', border: '1px solid var(--border-default)', borderRadius: 999, padding: '0.25rem 0.6rem', color: 'var(--text-secondary)', fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}>
            {category === 'scores' ? scoreRows.length : metric === 'trackComparison' ? filteredTrackRows.length : category === 'quality' ? filteredAverageRows.length : filteredCountRows.length} rows
          </span>
        </div>
        {renderVisual()}
      </div>
    </div>
  );
}
