'use client';

import { useEffect, useState } from 'react';
import { Award, Download, Lock, CheckCircle, Star, MessageSquare } from 'lucide-react';

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
            const certs = (cData.data || []).map((c: any) => ({
              ...c,
              hackathon: { id: h.id, title: h.title },
            }));
            allCerts.push(...certs);
          } catch { /* skip */ }
        }
        // Deduplicate: only one certificate per hackathon, prefer highest type
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

  const typeColors: Record<string, { bg: string; text: string; border: string }> = {
    WINNER: { bg: 'rgba(232,164,74,0.08)', text: '#e8a44a', border: 'rgba(232,164,74,0.25)' },
    RUNNER_UP: { bg: 'rgba(148,163,184,0.08)', text: '#94a3b8', border: 'rgba(148,163,184,0.25)' },
    PARTICIPANT: { bg: 'rgba(62,207,142,0.08)', text: '#3ecf8e', border: 'rgba(62,207,142,0.25)' },
    BEST_PROJECT: { bg: 'rgba(129,140,248,0.08)', text: '#818cf8', border: 'rgba(129,140,248,0.25)' },
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #e2e8f0', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Certificates</h1>
        <p className="text-gray-500 mt-1">Download your certificates after completing the feedback survey.</p>
      </div>

      {certificates.length === 0 ? (
        <div className="card text-center py-16">
          <Award className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-semibold text-gray-700">No certificates yet</p>
          <p className="text-sm text-gray-500 mt-2">Certificates will appear here after the hackathon ends and the organiser generates them.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {certificates.map((cert) => {
            const colors = typeColors[cert.type] || typeColors.PARTICIPANT;
            const isSurveyDone = surveyDone[cert.hackathon.id];
            const canDownload = isSurveyDone && (cert.pdfPath || cert.certificateUrl);

            return (
              <div key={cert.id} className="card flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
                  >
                    <Award className="w-6 h-6" style={{ color: colors.text }} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{cert.title || `${cert.type} Certificate`}</p>
                    <p className="text-sm text-gray-500 truncate">{cert.hackathon.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded"
                        style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
                      >
                        {cert.type.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(cert.issuedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  {isSurveyDone ? (
                    <span className="flex items-center gap-1 text-xs text-green-600">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Feedback done
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-amber-600">
                      <Lock className="w-3.5 h-3.5" />
                      Complete survey
                    </span>
                  )}

                  {canDownload ? (
                    <button
                      onClick={() => handleDownload(cert)}
                      className="btn btn-primary flex items-center gap-2 text-sm"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setSurveyOpen(cert.hackathon.id);
                        setSurvey({ rating: 0, bestPart: '', improvement: '', recommend: '' });
                      }}
                      className="btn btn-secondary flex items-center gap-2 text-sm"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Give Feedback
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Survey Modal */}
      {surveyOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '1rem',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSurveyOpen(null);
          }}
        >
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Quick Feedback</h2>
            <p className="text-sm text-gray-500 mb-6">
              Share your experience to unlock certificate downloads.
            </p>

            {/* Rating */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How would you rate this hackathon?
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setSurvey((s) => ({ ...s, rating: star }))}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className="w-8 h-8"
                      fill={star <= survey.rating ? '#e8a44a' : 'none'}
                      stroke={star <= survey.rating ? '#e8a44a' : '#d1d5db'}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Best Part */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                What was the best part?
              </label>
              <textarea
                className="input min-h-[60px]"
                value={survey.bestPart}
                onChange={(e) => setSurvey((s) => ({ ...s, bestPart: e.target.value }))}
                placeholder="e.g. The mentors were super helpful..."
              />
            </div>

            {/* Improvement */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                What could be improved?
              </label>
              <textarea
                className="input min-h-[60px]"
                value={survey.improvement}
                onChange={(e) => setSurvey((s) => ({ ...s, improvement: e.target.value }))}
                placeholder="e.g. More time for submissions..."
              />
            </div>

            {/* Recommend */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Would you recommend this to a friend?
              </label>
              <div className="flex gap-3">
                {['Definitely', 'Maybe', 'Not really'].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setSurvey((s) => ({ ...s, recommend: opt }))}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      survey.recommend === opt
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-300'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSurveyOpen(null)}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSurveySubmit(surveyOpen)}
                disabled={survey.rating === 0}
                className="btn btn-primary flex-1 disabled:opacity-50"
              >
                Submit & Unlock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
