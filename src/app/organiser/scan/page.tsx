'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface Hackathon { id: string; title: string; status: string }
interface ScanResult { action: string; userName: string; userEmail: string; time: string; alreadyDone: boolean }
interface AttendanceRow {
  id: string; checkInTime: string | null; breakfastRedeemed: boolean; lunchRedeemed: boolean; swagCollected: boolean;
  user: { id: string; name: string; email: string };
}

export default function ScanPage() {
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [hackathonId, setHackathonId] = useState('');
  const [scanInput, setScanInput] = useState('');
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState('');
  const [attendees, setAttendees] = useState<AttendanceRow[]>([]);
  const [stats, setStats] = useState({ checkedIn: 0, breakfast: 0, lunch: 0, swag: 0 });
  const [recentLog, setRecentLog] = useState<ScanResult[]>([]);
  const [cameraActive, setCameraActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'qr-reader';

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/hackathons?limit=50');
      const data = await res.json();
      const list: Hackathon[] = data.data || [];
      setHackathons(list);
      const active = list.find((h) => h.status === 'ONGOING') || list.find((h) => h.status === 'REGISTRATION') || list[0];
      if (active) setHackathonId(active.id);
    })();
  }, []);

  const loadAttendees = useCallback(async () => {
    if (!hackathonId) return;
    try {
      const res = await fetch(`/api/hackathons/${hackathonId}/attendance`);
      const list: AttendanceRow[] = (await res.json()).data || [];
      setAttendees(list);
      setStats({
        checkedIn: list.filter((a) => a.checkInTime).length,
        breakfast: list.filter((a) => a.breakfastRedeemed).length,
        lunch: list.filter((a) => a.lunchRedeemed).length,
        swag: list.filter((a) => a.swagCollected).length,
      });
    } catch { /* silent */ }
  }, [hackathonId]);

  useEffect(() => { loadAttendees(); const t = setInterval(loadAttendees, 5000); return () => clearInterval(t); }, [loadAttendees]);
  useEffect(() => { inputRef.current?.focus(); }, [hackathonId]);

  const handleAction = useCallback(async (action: string, userId: string) => {
    if (!hackathonId || !userId) return;
    setLoading(action); setError(''); setLastResult(null);
    try {
      const res = await fetch(`/api/hackathons/${hackathonId}/attendance`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action }),
      });
      const data = await res.json();
      if (res.ok) {
        const existing = attendees.find((a) => a.user.id === userId);
        const alreadyDone =
          (action === 'CHECK_IN' && !!existing?.checkInTime) ||
          (action === 'BREAKFAST' && existing?.breakfastRedeemed) ||
          (action === 'LUNCH' && existing?.lunchRedeemed) ||
          (action === 'SWAG' && existing?.swagCollected);
        const result: ScanResult = {
          action,
          userName: existing?.user.name || data.data?.user?.name || userId,
          userEmail: existing?.user.email || data.data?.user?.email || '',
          time: new Date().toLocaleTimeString(),
          alreadyDone,
        };
        setLastResult(result);
        setRecentLog((prev) => [result, ...prev].slice(0, 20));
        loadAttendees();
      } else { setError(data.error || 'Action failed'); }
    } catch { setError('Network error'); }
    setLoading(''); setScanInput(''); inputRef.current?.focus();
  }, [hackathonId, attendees, loadAttendees]);

  const handleScan = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!scanInput.trim()) return;
    const parts = scanInput.trim().split(':');
    const userId = parts[0];
    if (parts[1] && parts[1] !== hackathonId) { setError('QR code is for a different hackathon'); setScanInput(''); return; }
    handleAction('CHECK_IN', userId);
  }, [scanInput, hackathonId, handleAction]);

  // Camera scanner
  const startCamera = useCallback(async () => {
    if (cameraActive) return;
    try {
      const html5QrCode = new Html5Qrcode(scannerContainerId);
      scannerRef.current = html5QrCode;
      await html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          const parts = decodedText.trim().split(':');
          const userId = parts[0];
          if (parts[1] && parts[1] !== hackathonId) { setError('QR code is for a different hackathon'); return; }
          handleAction('CHECK_IN', userId);
        },
        () => {} // ignore errors during scanning
      );
      setCameraActive(true);
    } catch (err) {
      setError('Camera access denied or not available');
    }
  }, [cameraActive, hackathonId, handleAction]);

  const stopCamera = useCallback(async () => {
    if (scannerRef.current && cameraActive) {
      try { await scannerRef.current.stop(); } catch { /* silent */ }
      scannerRef.current = null;
      setCameraActive(false);
    }
  }, [cameraActive]);

  useEffect(() => { return () => { stopCamera(); }; }, [stopCamera]);

  const actionButtons = [
    { action: 'CHECK_IN', label: 'Check In', color: '#3ecf8e' },
    { action: 'BREAKFAST', label: 'Breakfast', color: '#f59e0b' },
    { action: 'LUNCH', label: 'Lunch', color: '#e8a44a' },
    { action: 'SWAG', label: 'Swag', color: '#818cf8' },
  ];

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <p style={sectionLabel}>Operations</p>
          <h1 style={pageTitle}>QR Scan Station</h1>
        </div>
        <select value={hackathonId} onChange={(e) => setHackathonId(e.target.value)} style={selectStyle}>
          {hackathons.map((h) => <option key={h.id} value={h.id} style={{ background: 'var(--bg-surface)' }}>{h.title}</option>)}
        </select>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
        {[
          { label: 'Checked In', value: stats.checkedIn, color: '#3ecf8e' },
          { label: 'Breakfast', value: stats.breakfast, color: '#f59e0b' },
          { label: 'Lunch', value: stats.lunch, color: '#e8a44a' },
          { label: 'Swag', value: stats.swag, color: '#818cf8' },
          { label: 'Total', value: attendees.length, color: 'var(--text-secondary)' },
        ].map((s) => (
          <div key={s.label} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderLeft: `3px solid ${s.color}`, borderRadius: 'var(--radius-lg)', padding: '0.85rem' }}>
            <p style={statLabel}>{s.label}</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
        {/* Left: Scanner + Manual */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* Camera Scanner */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <p style={statLabel}>Camera Scanner</p>
              <button onClick={cameraActive ? stopCamera : startCamera} className={cameraActive ? 'org-btn-danger' : 'org-btn-primary'} style={{ fontSize: '0.65rem', padding: '0.3rem 0.6rem' }}>
                {cameraActive ? 'Stop Camera' : 'Start Camera'}
              </button>
            </div>
            <div id={scannerContainerId} style={{
              width: '100%', minHeight: cameraActive ? 250 : 0,
              borderRadius: 'var(--radius-md)', overflow: 'hidden',
              background: cameraActive ? '#000' : 'var(--bg-raised)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {!cameraActive && <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', padding: '2rem', textAlign: 'center' }}>Click &quot;Start Camera&quot; to scan QR codes with your device camera.</p>}
            </div>
          </div>

          {/* Manual Input */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '1rem' }}>
            <p style={{ ...statLabel, marginBottom: '0.6rem' }}>Manual Entry</p>
            <form onSubmit={handleScan} style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.6rem' }}>
              <input ref={inputRef} value={scanInput} onChange={(e) => setScanInput(e.target.value)} placeholder="userId:hackathonId" autoComplete="off" className="org-input" style={{ flex: 1, fontSize: '0.78rem' }} />
              <button type="submit" disabled={!scanInput.trim() || !!loading} className="org-btn-primary" style={{ fontSize: '0.65rem' }}>
                {loading ? '...' : 'Submit'}
              </button>
            </form>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.35rem' }}>
              {actionButtons.map((btn) => (
                <button key={btn.action} disabled={!!loading || !scanInput.trim()} onClick={() => scanInput.trim() && handleAction(btn.action, scanInput.trim().split(':')[0])} style={{
                  padding: '0.5rem', background: 'var(--bg-raised)', border: `1px solid ${btn.color}30`,
                  borderRadius: 'var(--radius-sm)', color: btn.color, fontFamily: 'var(--font-display)',
                  fontSize: '0.68rem', fontWeight: 600, cursor: 'pointer',
                  opacity: !!loading || !scanInput.trim() ? 0.4 : 1,
                }}>{btn.label}</button>
              ))}
            </div>
          </div>

          {/* Last Result */}
          {error && <div className="org-feedback org-feedback-error">{error}</div>}
          {lastResult && (
            <div style={{
              padding: '0.75rem 1rem',
              background: lastResult.alreadyDone ? 'rgba(232,164,74,0.06)' : 'rgba(62,207,142,0.06)',
              border: `1px solid ${lastResult.alreadyDone ? 'rgba(232,164,74,0.2)' : 'rgba(62,207,142,0.2)'}`,
              borderRadius: 'var(--radius-md)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                <span style={{
                  fontFamily: 'var(--font-display)', fontSize: '0.58rem', fontWeight: 600, letterSpacing: '0.1em',
                  padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-sm)',
                  background: lastResult.alreadyDone ? 'rgba(232,164,74,0.12)' : 'rgba(62,207,142,0.12)',
                  color: lastResult.alreadyDone ? '#e8a44a' : '#3ecf8e',
                }}>{lastResult.alreadyDone ? 'ALREADY DONE' : 'SUCCESS'}</span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{lastResult.time}</span>
              </div>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.88rem' }}>{lastResult.userName}</p>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{lastResult.action.replace('_', ' ')} &middot; {lastResult.userEmail}</p>
            </div>
          )}

          {/* Recent Log */}
          {recentLog.length > 0 && (
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '0.75rem' }}>
              <p style={statLabel}>Recent Activity</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxHeight: 200, overflowY: 'auto' }}>
                {recentLog.map((entry, i) => {
                  const actionColor = entry.action === 'CHECK_IN' ? '#3ecf8e' : entry.action === 'BREAKFAST' ? '#f59e0b' : entry.action === 'LUNCH' ? '#e8a44a' : '#818cf8';
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.5rem', background: 'var(--bg-raised)', borderRadius: 'var(--radius-sm)' }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.5rem', fontWeight: 600, padding: '0.1rem 0.3rem', borderRadius: 3, background: `${actionColor}15`, color: actionColor }}>{entry.action.replace('_', ' ')}</span>
                      <span style={{ flex: 1, fontSize: '0.72rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.userName}</span>
                      <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{entry.time}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right: Attendee Table */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-subtle)' }}>
            <p style={statLabel}>Attendees ({attendees.length})</p>
          </div>
          <div style={{ maxHeight: 600, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  {['Name', 'CI', 'B', 'L', 'S', 'Actions'].map((h) => (
                    <th key={h} style={{ padding: '0.5rem 0.6rem', textAlign: h === 'Name' ? 'left' : h === 'Actions' ? 'right' : 'center', ...statLabel, fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {attendees.slice(0, 80).map((a) => (
                  <tr key={a.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '0.5rem 0.6rem' }}>
                      <p style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-primary)' }}>{a.user.name}</p>
                      <p style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{a.user.email}</p>
                    </td>
                    {[a.checkInTime, a.breakfastRedeemed, a.lunchRedeemed, a.swagCollected].map((done, i) => {
                      const colors = ['#3ecf8e', '#f59e0b', '#e8a44a', '#818cf8'];
                      return <td key={i} style={{ padding: '0.4rem', textAlign: 'center', fontSize: '0.8rem', fontWeight: 700, color: done ? colors[i] : 'var(--text-muted)' }}>{done ? '\u2713' : '\u2014'}</td>;
                    })}
                    <td style={{ padding: '0.4rem 0.6rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 3, justifyContent: 'flex-end' }}>
                        {!a.checkInTime && <button onClick={() => handleAction('CHECK_IN', a.user.id)} disabled={!!loading} style={miniBtn('#3ecf8e')}>CI</button>}
                        {!a.breakfastRedeemed && <button onClick={() => handleAction('BREAKFAST', a.user.id)} disabled={!!loading} style={miniBtn('#f59e0b')}>B</button>}
                        {!a.lunchRedeemed && <button onClick={() => handleAction('LUNCH', a.user.id)} disabled={!!loading} style={miniBtn('#e8a44a')}>L</button>}
                        {!a.swagCollected && <button onClick={() => handleAction('SWAG', a.user.id)} disabled={!!loading} style={miniBtn('#818cf8')}>S</button>}
                      </div>
                    </td>
                  </tr>
                ))}
                {attendees.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>No attendees yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

const sectionLabel: React.CSSProperties = { fontFamily: 'var(--font-display)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--accent)', marginBottom: '0.4rem' };
const pageTitle: React.CSSProperties = { fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' };
const statLabel: React.CSSProperties = { fontFamily: 'var(--font-display)', fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '0.25rem' };
const selectStyle: React.CSSProperties = { background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontFamily: 'var(--font-display)', fontSize: '0.72rem', padding: '0.5rem 0.75rem', outline: 'none', cursor: 'pointer' };
const miniBtn = (color: string): React.CSSProperties => ({ padding: '0.15rem 0.35rem', background: 'none', border: `1px solid ${color}30`, borderRadius: 4, color, fontFamily: 'var(--font-display)', fontSize: '0.58rem', fontWeight: 600, cursor: 'pointer' });
