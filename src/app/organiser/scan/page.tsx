'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import { QrCode } from 'lucide-react';
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
      color: 'var(--accent)',
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
        () => {}
      );
      setCameraActive(true);
    } catch {
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
  }, [handleAction]);

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

  const tableColSpan = mealSchedule.length + 2;

  return (
    <div className="min-h-full">
      <div className="mx-auto max-w-[1200px] px-5 py-8 sm:px-8 sm:py-10">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 border-b border-[var(--border-default)] pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <Link
              href="/organiser/dashboard"
              className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--accent)] hover:text-[var(--accent-hover)]"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Dashboard
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="h-[1px] w-6 bg-[var(--accent)]" />
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                Operations
              </p>
            </div>
            <h1 className="mt-2 flex flex-wrap items-center gap-2 font-display text-[clamp(1.35rem,2.2vw,1.65rem)] font-bold tracking-tight text-[var(--text-primary)]">
              <QrCode className="h-6 w-6 shrink-0 text-[var(--accent)]" aria-hidden />
              QR scan station
            </h1>
            <p className="mt-2 max-w-xl text-[14px] text-[var(--text-secondary)]">
              Redeem attendance from camera, image capture, or manual token entry. The roster refreshes every few seconds.
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[240px]">
            <label htmlFor="scan-hackathon" className="font-mono text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Event
            </label>
            <select
              id="scan-hackathon"
              value={hackathonId}
              onChange={(e) => setHackathonId(e.target.value)}
              className="input"
            >
              {hackathons.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          {/* Left column */}
          <div className="flex flex-col gap-3">
            {/* Camera scanner */}
            <section className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="font-mono text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Camera scanner</p>
                <button
                  type="button"
                  onClick={cameraActive ? stopCamera : startCamera}
                  className={cameraActive ? 'btn btn-danger !min-h-[32px] !text-[12px]' : 'btn btn-primary !min-h-[32px] !text-[12px]'}
                >
                  {cameraActive ? 'Stop camera' : 'Start camera'}
                </button>
              </div>
              <div className="relative">
                <div
                  id={scannerContainerId}
                  className={`w-full overflow-hidden rounded-[var(--radius-md)] ${cameraActive ? 'min-h-[250px] bg-black' : 'min-h-0 bg-[var(--bg-raised)]'}`}
                />
                {!cameraActive && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
                    <p className="text-center text-[13px] text-[var(--text-muted)]">
                      Use <span className="font-medium text-[var(--text-secondary)]">Start camera</span> to scan QR codes with this device.
                    </p>
                  </div>
                )}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <label
                  className={`btn btn-secondary !min-h-[32px] !text-[12px] inline-flex cursor-pointer items-center ${fileScanBusy ? 'pointer-events-none opacity-60' : ''}`}
                >
                  Capture QR
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileCapture}
                    disabled={fileScanBusy}
                    className="hidden"
                  />
                </label>
                <span className="text-[11px] text-[var(--text-muted)]">From a photo or screenshot</span>
              </div>
            </section>

            {/* Manual entry */}
            <section className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-4">
              <p className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Manual entry</p>
              <div className="mb-3">
                <select
                  value={selectedOptionId}
                  onChange={(e) => setSelectedOptionId(e.target.value)}
                  className="input"
                >
                  {actionOptions.length === 0 && <option value="">Add an attendance event first</option>}
                  {actionOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <form onSubmit={handleScan} className="mb-2 flex flex-col gap-2 sm:flex-row">
                <input
                  ref={inputRef}
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  placeholder="QR token or user ID"
                  autoComplete="off"
                  className="input flex-1"
                />
                <button
                  type="submit"
                  disabled={!scanInput.trim() || !!loading}
                  className="btn btn-primary !min-h-[40px] shrink-0 px-4 sm:w-auto"
                >
                  {loading ? '…' : 'Submit'}
                </button>
              </form>
              <p className="text-[11px] text-[var(--text-muted)]">
                Selected: <span className="font-medium text-[var(--text-secondary)]">{selectedOption?.label || '—'}</span>
              </p>
            </section>

            {/* Add attendance event */}
            <section className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-4">
              <p className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Add attendance event</p>
              <div className="mb-3 flex flex-col gap-2 sm:flex-row">
                <input
                  className="input flex-1"
                  value={newEventName}
                  onChange={(e) => setNewEventName(e.target.value)}
                  placeholder="Event name (saved to schedule)"
                />
                <button
                  type="button"
                  className="btn btn-secondary !min-h-[40px] shrink-0"
                  onClick={addAttendanceEvent}
                  disabled={!newEventName.trim()}
                >
                  Add event
                </button>
              </div>
            </section>

            {/* Error */}
            {error && (
              <div className="rounded-[var(--radius-md)] border border-[rgba(239,68,68,0.2)] bg-[var(--error-dim)] px-4 py-3 text-[13px] font-medium text-[var(--error)]">
                {error}
              </div>
            )}

            {/* Last result */}
            {lastResult && (
              <div
                className={`rounded-[var(--radius-lg)] border p-4 ${
                  lastResult.alreadyDone
                    ? 'border-[rgba(245,158,11,0.2)] bg-[var(--warning-dim)]'
                    : 'border-[rgba(16,185,129,0.2)] bg-[var(--success-dim)]'
                }`}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span
                    className={`rounded-[var(--radius-full)] px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide ${
                      lastResult.alreadyDone
                        ? 'bg-[var(--warning-dim)] text-[var(--warning)]'
                        : 'bg-[var(--success-dim)] text-[var(--success)]'
                    }`}
                  >
                    {lastResult.alreadyDone ? 'Already done' : 'Success'}
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)]">{lastResult.time}</span>
                </div>
                <p className="text-[14px] font-semibold text-[var(--text-primary)]">{lastResult.userName}</p>
                <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
                  {lastResult.action} · {lastResult.userEmail}
                </p>
              </div>
            )}

            {/* Recent activity */}
            {recentLog.length > 0 && (
              <section className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-3">
                <p className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Recent activity</p>
                <div className="flex max-h-[200px] flex-col gap-1 overflow-y-auto">
                  {recentLog.map((entry, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--bg-raised)] px-2.5 py-1.5"
                    >
                      <span className="max-w-[40%] shrink-0 truncate rounded-full bg-[var(--accent-dim)] px-2 py-0.5 font-mono text-[10px] font-semibold uppercase text-[var(--accent)]">
                        {entry.action}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--text-primary)]">{entry.userName}</span>
                      <span className="shrink-0 text-[11px] text-[var(--text-muted)]">{entry.time}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right column: Attendees */}
          <section className="flex min-h-0 flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)]">
            <div className="border-b border-[var(--border-default)] px-4 py-3">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="font-mono text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    Attendees ({attendees.length})
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="rounded-[var(--radius-full)] border border-[var(--border-default)] bg-[var(--bg-root)] px-2.5 py-1 font-mono text-[10px] text-[var(--text-secondary)]">
                      Checked in <strong className="text-[var(--text-primary)]">{stats.checkedIn}</strong>
                    </span>
                    <span className="rounded-[var(--radius-full)] border border-[var(--border-default)] bg-[var(--bg-root)] px-2.5 py-1 font-mono text-[10px] text-[var(--text-secondary)]">
                      Breakfast <strong className="text-[var(--text-primary)]">{stats.breakfast}</strong>
                    </span>
                    <span className="rounded-[var(--radius-full)] border border-[var(--border-default)] bg-[var(--bg-root)] px-2.5 py-1 font-mono text-[10px] text-[var(--text-secondary)]">
                      Lunch <strong className="text-[var(--text-primary)]">{stats.lunch}</strong>
                    </span>
                    <span className="rounded-[var(--radius-full)] border border-[var(--border-default)] bg-[var(--bg-root)] px-2.5 py-1 font-mono text-[10px] text-[var(--text-secondary)]">
                      Swag <strong className="text-[var(--text-primary)]">{stats.swag}</strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="max-h-[min(600px,70vh)] overflow-x-auto overflow-y-auto">
              <table className="w-full min-w-[320px] border-collapse text-left text-[13px]">
                <thead>
                  <tr className="border-b border-[var(--border-default)]">
                    <th className="px-3 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Name</th>
                    {mealSchedule.map((event) => (
                      <th
                        key={event.id}
                        className="px-2 py-2.5 text-center font-mono text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]"
                      >
                        {event.name || 'Event'}
                      </th>
                    ))}
                    <th className="px-3 py-2.5 text-right font-mono text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      Note
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {attendees.slice(0, 80).map((a) => (
                    <tr key={a.id} className="transition-colors hover:bg-[var(--bg-raised)]">
                      <td className="px-3 py-2.5 align-top">
                        <p className="font-medium text-[var(--text-primary)]">{a.user.name}</p>
                        <p className="text-[11px] text-[var(--text-muted)]">{a.user.email}</p>
                      </td>
                      {mealSchedule.map((event) => {
                        const marks = a.eventMarks || {};
                        const done = !!marks[event.id];
                        return (
                          <td
                            key={event.id}
                            className={`px-2 py-2.5 text-center text-base font-semibold ${done ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}
                          >
                            {done ? '✓' : '—'}
                          </td>
                        );
                      })}
                      <td className="px-3 py-2.5 text-right text-[11px] text-[var(--text-muted)]">Scanner</td>
                    </tr>
                  ))}
                  {attendees.length === 0 && (
                    <tr>
                      <td colSpan={tableColSpan} className="px-4 py-12 text-center text-[var(--text-secondary)]">
                        No attendees yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
        <div id={fileScannerId} className="hidden" aria-hidden />
      </div>
    </div>
  );
}
