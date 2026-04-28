'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface Hackathon { id: string; title: string; status: string }
interface MealSlot { id: string; name: string; startTime: string; endTime: string; day: number }
interface ScanResult { action: string; userName: string; userEmail: string; time: string; alreadyDone: boolean }
interface AttendanceRow {
  id: string; checkInTime: string | null; breakfastRedeemed: boolean; lunchRedeemed: boolean; swagCollected: boolean;
  user: { id: string; name: string; email: string };
  eventMarks?: Record<string, string> | null;
}

type AttendanceOption = {
  id: string;
  label: string;
  action: 'CHECK_IN' | 'BREAKFAST' | 'LUNCH' | 'SWAG' | 'EVENT';
  eventId?: string;
  color: string;
};

export default function ScanPage() {
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [hackathonId, setHackathonId] = useState('');
  const [mealSchedule, setMealSchedule] = useState<MealSlot[]>([]);
  const [scanInput, setScanInput] = useState('');
  const [selectedOptionId, setSelectedOptionId] = useState('');
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState('');
  const [attendees, setAttendees] = useState<AttendanceRow[]>([]);
  const [stats, setStats] = useState({ checkedIn: 0, breakfast: 0, lunch: 0, swag: 0 });
  const [recentLog, setRecentLog] = useState<ScanResult[]>([]);
  const [cameraActive, setCameraActive] = useState(false);
  const [fileScanBusy, setFileScanBusy] = useState(false);
  const [newEventName, setNewEventName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const selectedOptionRef = useRef<string>('CHECK_IN');
  const actionOptionsRef = useRef<AttendanceOption[]>([]);
  const scannerContainerId = 'qr-reader';
  const fileScannerId = 'qr-file-reader';

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

  useEffect(() => {
    if (!hackathonId) return;
    (async () => {
      try {
        const res = await fetch(`/api/hackathons/${hackathonId}`);
        const data = await res.json();
        const schedule = (data.data?.mealSchedule || []) as MealSlot[];
        setMealSchedule(Array.isArray(schedule) ? schedule : []);
        const firstEvent = Array.isArray(schedule) && schedule.length > 0 ? `EVENT:${schedule[0].id}` : '';
        setSelectedOptionId(firstEvent);
      } catch { /* silent */ }
    })();
  }, [hackathonId]);

  const actionOptions: AttendanceOption[] = useMemo(() => ([
    ...mealSchedule.map((meal) => ({
      id: `EVENT:${meal.id}`,
      label: meal.name || `Event Day ${meal.day}`,
      action: 'EVENT' as const,
      eventId: meal.id,
      color: '#38bdf8',
    })),
  ]), [mealSchedule]);

  const selectedOption = actionOptions.find((opt) => opt.id === selectedOptionId) || actionOptions[0];

  useEffect(() => {
    selectedOptionRef.current = selectedOptionId;
  }, [selectedOptionId]);

  useEffect(() => {
    actionOptionsRef.current = actionOptions;
  }, [actionOptions]);

  const handleAction = useCallback(async (action: AttendanceOption, opts: { qrToken?: string; userId?: string }) => {
    if (!hackathonId || (!opts.qrToken && !opts.userId)) return;
    if (action.action === 'EVENT' && !action.eventId) {
      setError('Select a valid attendance event');
      return;
    }
    setLoading(action.id); setError(''); setLastResult(null);
    try {
      const res = await fetch(`/api/hackathons/${hackathonId}/attendance`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: action.action,
          eventId: action.eventId,
          ...(opts.qrToken ? { qrToken: opts.qrToken } : { userId: opts.userId }),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        const existing = data.user?.id ? attendees.find((a) => a.user.id === data.user?.id) : null;
        const alreadyDoneLocal =
          (action.action === 'CHECK_IN' && !!existing?.checkInTime) ||
          (action.action === 'BREAKFAST' && existing?.breakfastRedeemed) ||
          (action.action === 'LUNCH' && existing?.lunchRedeemed) ||
          (action.action === 'SWAG' && existing?.swagCollected);
        const alreadyDone = !!data.alreadyDone || alreadyDoneLocal;
        const result: ScanResult = {
          action: action.label,
          userName: existing?.user.name || data.user?.name || data.user?.email || 'Unknown',
          userEmail: existing?.user.email || data.user?.email || '',
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
    const options = actionOptionsRef.current;
    const optionId = selectedOptionRef.current;
    const option = options.find((opt) => opt.id === optionId) || options[0];
    if (!option) { setError('Add an attendance event first'); return; }
    handleAction(option, { qrToken: scanInput.trim() });
  }, [scanInput, handleAction]);

  // Camera scanner
  const startCamera = useCallback(async () => {
    if (cameraActive) return;
    try {
      if (!document.getElementById(scannerContainerId)) {
        setError('Scanner container not ready');
        return;
      }
      if (scannerRef.current) {
        try { await scannerRef.current.stop(); } catch { /* silent */ }
        try { await scannerRef.current.clear(); } catch { /* silent */ }
        scannerRef.current = null;
      }
      const html5QrCode = new Html5Qrcode(scannerContainerId);
      scannerRef.current = html5QrCode;
      await html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          const options = actionOptionsRef.current;
          const optionId = selectedOptionRef.current;
          const option = options.find((opt) => opt.id === optionId) || options[0];
          if (!option) { setError('Add an attendance event first'); return; }
          handleAction(option, { qrToken: decodedText.trim() });
        },
        () => {} // ignore errors during scanning
      );
      setCameraActive(true);
    } catch (err) {
      setError('Camera access denied or not available');
    }
  }, [cameraActive, handleAction]);

  const stopCamera = useCallback(async () => {
    if (scannerRef.current && cameraActive) {
      try { await scannerRef.current.stop(); } catch { /* silent */ }
      try { await scannerRef.current.clear(); } catch { /* silent */ }
      scannerRef.current = null;
      setCameraActive(false);
    }
  }, [cameraActive]);

  const handleFileCapture = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const options = actionOptionsRef.current;
    const optionId = selectedOptionRef.current;
    const option = options.find((opt) => opt.id === optionId) || options[0];
    if (!option) { setError('Add an attendance event first'); setFileScanBusy(false); e.target.value = ''; return; }
    setFileScanBusy(true);
    try {
      const fileScanner = new Html5Qrcode(fileScannerId);
      const decodedText = await fileScanner.scanFile(file, false);
      try { await fileScanner.clear(); } catch { /* silent */ }
      handleAction(option, { qrToken: decodedText.trim() });
    } catch {
      setError('Unable to read QR from the captured image');
    } finally {
      setFileScanBusy(false);
      e.target.value = '';
    }
  }, [actionOptions, selectedOptionId, handleAction]);

  useEffect(() => { return () => { stopCamera(); }; }, [stopCamera]);

  const addAttendanceEvent = useCallback(async () => {
    if (!hackathonId || !newEventName.trim()) return;
    const newEvent: MealSlot = {
      id: crypto.randomUUID(),
      name: newEventName.trim(),
      day: 1,
      startTime: '09:00',
      endTime: '10:00',
    };
    const nextSchedule = [...mealSchedule, newEvent];
    try {
      const res = await fetch(`/api/hackathons/${hackathonId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mealSchedule: nextSchedule }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to add event');
        return;
      }
      setMealSchedule(nextSchedule);
      setNewEventName('');
    } catch { setError('Failed to add event'); }
  }, [hackathonId, mealSchedule, newEventName]);

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
            <div style={{ position: 'relative' }}>
              <div id={scannerContainerId} style={{
                width: '100%', minHeight: cameraActive ? 250 : 0,
                borderRadius: 'var(--radius-md)', overflow: 'hidden',
                background: cameraActive ? '#000' : 'var(--bg-raised)',
              }} />
              {!cameraActive && (
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  pointerEvents: 'none',
                }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', padding: '2rem', textAlign: 'center' }}>
                    Click &quot;Start Camera&quot; to scan QR codes with your device camera.
                  </p>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.6rem' }}>
              <label className="org-btn-secondary" style={{ fontSize: '0.65rem', padding: '0.3rem 0.6rem', cursor: fileScanBusy ? 'not-allowed' : 'pointer', opacity: fileScanBusy ? 0.6 : 1 }}>
                Capture QR
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileCapture}
                  disabled={fileScanBusy}
                  style={{ display: 'none' }}
                />
              </label>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Scan from a camera snapshot</span>
            </div>
          </div>

          {/* Manual Input */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '1rem' }}>
            <p style={{ ...statLabel, marginBottom: '0.6rem' }}>Manual Entry</p>
            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.6rem' }}>
              <select value={selectedOptionId} onChange={(e) => setSelectedOptionId(e.target.value)} className="org-input" style={{ flex: 1, fontSize: '0.78rem' }}>
                {actionOptions.length === 0 && <option value="">Add an attendance event</option>}
                {actionOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
            </div>
            <form onSubmit={handleScan} style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.6rem' }}>
              <input ref={inputRef} value={scanInput} onChange={(e) => setScanInput(e.target.value)} placeholder="QR code text or user ID" autoComplete="off" className="org-input" style={{ flex: 1, fontSize: '0.78rem' }} />
              <button type="submit" disabled={!scanInput.trim() || !!loading} className="org-btn-primary" style={{ fontSize: '0.65rem' }}>
                {loading ? '...' : 'Submit'}
              </button>
            </form>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
              Selected: {selectedOption?.label || 'None'}
            </p>
          </div>

          {/* Add Attendance Event */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '1rem' }}>
            <p style={{ ...statLabel, marginBottom: '0.6rem' }}>Add Attendance Event</p>
            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.6rem' }}>
              <input className="org-input" value={newEventName} onChange={(e) => setNewEventName(e.target.value)} placeholder="Event name" style={{ flex: 1 }} />
            </div>
            <button className="org-btn-secondary" onClick={addAttendanceEvent} disabled={!newEventName.trim()} style={{ fontSize: '0.7rem' }}>
              Add Event
            </button>
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
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{lastResult.action} &middot; {lastResult.userEmail}</p>
            </div>
          )}

          {/* Recent Log */}
          {recentLog.length > 0 && (
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '0.75rem' }}>
              <p style={statLabel}>Recent Activity</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxHeight: 200, overflowY: 'auto' }}>
                {recentLog.map((entry, i) => {
                  const actionColor = entry.action === 'Check In' ? '#3ecf8e' : entry.action === 'Breakfast' ? '#f59e0b' : entry.action === 'Lunch' ? '#e8a44a' : entry.action === 'Swag' ? '#818cf8' : '#38bdf8';
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.5rem', background: 'var(--bg-raised)', borderRadius: 'var(--radius-sm)' }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.5rem', fontWeight: 600, padding: '0.1rem 0.3rem', borderRadius: 3, background: `${actionColor}15`, color: actionColor }}>{entry.action}</span>
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
                  <th style={{ padding: '0.5rem 0.6rem', textAlign: 'left', ...statLabel, fontWeight: 500 }}>Name</th>
                  {mealSchedule.map((event) => (
                    <th key={event.id} style={{ padding: '0.5rem 0.6rem', textAlign: 'center', ...statLabel, fontWeight: 500 }}>
                      {event.name || 'Event'}
                    </th>
                  ))}
                  <th style={{ padding: '0.5rem 0.6rem', textAlign: 'right', ...statLabel, fontWeight: 500 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {attendees.slice(0, 80).map((a) => (
                  <tr key={a.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '0.5rem 0.6rem' }}>
                      <p style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-primary)' }}>{a.user.name}</p>
                      <p style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{a.user.email}</p>
                    </td>
                    {mealSchedule.map((event) => {
                      const marks = a.eventMarks || {};
                      const done = !!marks[event.id];
                      return (
                        <td key={event.id} style={{ padding: '0.4rem', textAlign: 'center', fontSize: '0.8rem', fontWeight: 700, color: done ? '#38bdf8' : 'var(--text-muted)' }}>
                          {done ? '\u2713' : '\u2014'}
                        </td>
                      );
                    })}
                    <td style={{ padding: '0.4rem 0.6rem', textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                      Use scanner
                    </td>
                  </tr>
                ))}
                {attendees.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>No attendees yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div id={fileScannerId} style={{ display: 'none' }} />
    </div>
  );
}

const sectionLabel: React.CSSProperties = { fontFamily: 'var(--font-display)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--accent)', marginBottom: '0.4rem' };
const pageTitle: React.CSSProperties = { fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' };
const statLabel: React.CSSProperties = { fontFamily: 'var(--font-display)', fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '0.25rem' };
const selectStyle: React.CSSProperties = { background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontFamily: 'var(--font-display)', fontSize: '0.72rem', padding: '0.5rem 0.75rem', outline: 'none', cursor: 'pointer' };
const miniBtn = (color: string): React.CSSProperties => ({ padding: '0.15rem 0.35rem', background: 'none', border: `1px solid ${color}30`, borderRadius: 4, color, fontFamily: 'var(--font-display)', fontSize: '0.58rem', fontWeight: 600, cursor: 'pointer' });
