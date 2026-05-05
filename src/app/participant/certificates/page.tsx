'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Award,
  CheckCircle,
  Download,
  Lock,
  MessageSquare,
  Star,
} from 'lucide-react';

interface Certificate {
  id: string;
  type: string;
  title: string;
  certificateUrl: string | null;
  pdfPath: string | null;
  issuedAt: string;
  hackathon: { id: string; title: string };
}

interface SurveyData {
  rating: number;
  bestPart: string;
  improvement: string;
  recommend: string;
}

function typeBadgeClass(type: string): string {
  switch (type) {
    case 'WINNER':
      return 'org-badge org-badge-warning';
    case 'RUNNER_UP':
      return 'org-badge org-badge-muted';
    case 'BEST_PROJECT':
      return 'org-badge org-badge-accent';
    default:
      return 'org-badge org-badge-success';
  }
}

export default function ParticipantCertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [surveyOpen, setSurveyOpen] = useState<string | null>(null);
  const [survey, setSurvey] = useState<SurveyData>({ rating: 0, bestPart: '', improvement: '', recommend: '' });
  const [surveyDone, setSurveyDone] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/hackathons?limit=50');
        const data = await res.json();
        const hackathons = data.data || [];

        const allCerts: Certificate[] = [];
        for (const h of hackathons) {
          try {
            const cRes = await fetch(`/api/hackathons/${h.id}/certificates`);
            const cData = await cRes.json();
            const certs = (cData.data || []).map((c: Certificate & { hackathon?: unknown }) => ({
              ...c,
              hackathon: { id: h.id, title: h.title },
            }));
            allCerts.push(...certs);
          } catch {
            /* skip */
          }
        }
        const typePriority: Record<string, number> = {
          WINNER: 4,
          RUNNER_UP: 3,
          BEST_PROJECT: 2,
          PARTICIPANT: 1,
        };
        const certMap = new Map<string, Certificate>();
        for (const cert of allCerts) {
          const key = cert.hackathon.id;
          if (!certMap.has(key) || (typePriority[cert.type] ?? 0) > (typePriority[certMap.get(key)!.type] ?? 0)) {
            certMap.set(key, cert);
          }
        }
        setCertificates(Array.from(certMap.values()));
      } catch (e) {
        console.error('Failed to load certificates:', e);
      } finally {
        setLoading(false);
      }
    }
    load();

    const done: Record<string, boolean> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('survey-done:')) {
        done[key.replace('survey-done:', '')] = true;
      }
    }
    setSurveyDone(done);
  }, []);

  function handleSurveySubmit(hackathonId: string) {
    if (survey.rating === 0) return;
    localStorage.setItem(`survey-done:${hackathonId}`, JSON.stringify(survey));
    setSurveyDone((prev) => ({ ...prev, [hackathonId]: true }));
    setSurveyOpen(null);
    setSurvey({ rating: 0, bestPart: '', improvement: '', recommend: '' });
  }

  function handleDownload(cert: Certificate) {
    const url = cert.pdfPath || cert.certificateUrl;
    if (url) window.open(url, '_blank');
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center font-sans">
        <div
          className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--border-default)] border-t-[var(--accent)]"
          role="status"
          aria-label="Loading"
        />
      </div>
    );
  }

  return (
    <div className="font-sans text-[var(--text-primary)]">
      <div className="border-b border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[var(--elevation-sm)]">
        <div className="mx-auto max-w-[900px] px-4 py-5 sm:px-6">
          <Link
            href="/participant/dashboard"
            className="mb-3 inline-flex items-center gap-1.5 font-mono text-[12px] font-semibold uppercase tracking-wide text-[var(--text-secondary)] transition-colors hover:text-[var(--accent)]"
          >
            <ArrowLeft className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Dashboard
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <Award className="h-7 w-7 text-[var(--accent)]" aria-hidden />
            <p className="font-mono text-[12px] uppercase tracking-wide text-[var(--text-muted)]">Credentials</p>
          </div>
          <h1 className="mt-2 text-[clamp(1.35rem,2.4vw,1.85rem)] font-semibold leading-tight tracking-tight">
            Certificates
          </h1>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-[var(--text-secondary)]">
            Complete a short feedback survey per event to unlock downloads when organizers issue your certificate.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[900px] px-4 py-8 sm:px-6 sm:py-10">
        {certificates.length === 0 ? (
          <div className="rounded-[6px] border border-[var(--border-default)] bg-[var(--bg-elevated)] px-6 py-14 text-center shadow-[var(--elevation-sm)]">
            <Award className="mx-auto mb-4 h-12 w-12 text-[var(--text-muted)]" aria-hidden />
            <p className="text-lg font-semibold text-[var(--text-primary)]">No certificates yet</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-[var(--text-secondary)]">
              They appear here after an event ends and organizers generate credentials for you.
            </p>
            <Link
              href="/participant/hackathons"
              className="org-btn-secondary mt-6 inline-flex min-h-[40px] items-center justify-center no-underline"
            >
              Browse hackathons
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-4">
            {certificates.map((cert) => {
              const isSurveyDone = surveyDone[cert.hackathon.id];
              const canDownload = isSurveyDone && !!(cert.pdfPath || cert.certificateUrl);

              return (
                <li
                  key={cert.id}
                  className="flex flex-col gap-4 rounded-[6px] border border-[var(--border-default)] bg-[var(--bg-elevated)] p-5 shadow-[var(--elevation-sm)] sm:flex-row sm:items-center sm:justify-between sm:gap-6"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-4">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[6px] border border-[var(--border-default)] bg-[var(--accent-dim)]"
                      aria-hidden
                    >
                      <Award className="h-6 w-6 text-[var(--accent)]" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-[var(--text-primary)]">
                        {cert.title || `${cert.type.replace(/_/g, ' ')} certificate`}
                      </p>
                      <p className="mt-1 truncate text-sm text-[var(--text-secondary)]">{cert.hackathon.title}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className={typeBadgeClass(cert.type)}>{cert.type.replace(/_/g, ' ')}</span>
                        <span className="font-mono text-[12px] text-[var(--text-muted)]">
                          Issued {new Date(cert.issuedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col gap-3 sm:items-end">
                    {isSurveyDone ? (
                      <span className="inline-flex items-center gap-1.5 font-mono text-[12px] text-[var(--success)]">
                        <CheckCircle className="h-4 w-4 shrink-0" aria-hidden />
                        Feedback complete
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 font-mono text-[12px] text-[var(--warning)]">
                        <Lock className="h-4 w-4 shrink-0" aria-hidden />
                        Survey required to download
                      </span>
                    )}

                    {canDownload ? (
                      <button
                        type="button"
                        onClick={() => handleDownload(cert)}
                        className="org-btn-primary inline-flex min-h-[40px] w-full items-center justify-center gap-2 sm:w-auto"
                      >
                        <Download className="h-4 w-4" aria-hidden />
                        Download
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setSurveyOpen(cert.hackathon.id);
                          setSurvey({ rating: 0, bestPart: '', improvement: '', recommend: '' });
                        }}
                        className="org-btn-secondary inline-flex min-h-[40px] w-full items-center justify-center gap-2 sm:w-auto"
                      >
                        <MessageSquare className="h-4 w-4" aria-hidden />
                        Give feedback
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {surveyOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(31,35,40,0.45)] p-4 backdrop-blur-[1px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="survey-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSurveyOpen(null);
          }}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[6px] border border-[var(--border-default)] bg-[var(--bg-elevated)] p-6 shadow-[var(--elevation-sm)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="survey-title" className="text-lg font-semibold text-[var(--text-primary)]">
              Quick feedback
            </h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Share your experience to unlock certificate downloads for this event.
            </p>

            <div className="mt-6">
              <label className="mb-2 block font-mono text-[12px] uppercase tracking-wide text-[var(--text-muted)]">
                Overall rating
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setSurvey((s) => ({ ...s, rating: star }))}
                    className="rounded-[6px] p-1.5 text-[var(--warning)] transition-transform hover:scale-105"
                    aria-label={`${star} stars`}
                  >
                    <Star
                      className="h-8 w-8"
                      fill={star <= survey.rating ? 'currentColor' : 'none'}
                      stroke="currentColor"
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <label className="mb-1 block font-mono text-[12px] text-[var(--text-muted)]">What worked best?</label>
              <textarea
                className="org-input min-h-[72px] w-full resize-y text-sm"
                value={survey.bestPart}
                onChange={(e) => setSurvey((s) => ({ ...s, bestPart: e.target.value }))}
                placeholder="Mentors, venue, pacing…"
              />
            </div>

            <div className="mt-4">
              <label className="mb-1 block font-mono text-[12px] text-[var(--text-muted)]">What could improve?</label>
              <textarea
                className="org-input min-h-[72px] w-full resize-y text-sm"
                value={survey.improvement}
                onChange={(e) => setSurvey((s) => ({ ...s, improvement: e.target.value }))}
                placeholder="Honest suggestions help organizers iterate."
              />
            </div>

            <div className="mt-4">
              <label className="mb-2 block font-mono text-[12px] text-[var(--text-muted)]">
                Would you recommend this hackathon?
              </label>
              <div className="flex flex-wrap gap-2">
                {['Definitely', 'Maybe', 'Not really'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setSurvey((s) => ({ ...s, recommend: opt }))}
                    className={`rounded-[6px] border px-4 py-2 text-sm font-medium transition-colors ${
                      survey.recommend === opt
                        ? 'border-[var(--accent)] bg-[var(--accent-dim)] text-[var(--accent)]'
                        : 'border-[var(--border-default)] bg-[var(--bg-root)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button type="button" className="org-btn-secondary min-h-[40px] flex-1 sm:flex-none" onClick={() => setSurveyOpen(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="org-btn-primary min-h-[40px] flex-1 sm:flex-none disabled:opacity-50"
                disabled={survey.rating === 0}
                onClick={() => surveyOpen && handleSurveySubmit(surveyOpen)}
              >
                Submit & unlock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
