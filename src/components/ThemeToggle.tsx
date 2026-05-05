'use client';

import { useEffect, useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';

const STORAGE_KEY = 'hackmate-theme';

type ThemeChoice = 'light' | 'dark' | 'system';

function applyDarkClass(dark: boolean) {
  document.documentElement.classList.toggle('dark', dark);
}

function resolveDark(theme: ThemeChoice): boolean {
  if (theme === 'dark') return true;
  if (theme === 'light') return false;
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [mounted, setMounted] = useState(false);
  const [choice, setChoice] = useState<ThemeChoice>('system');

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeChoice | null;
    const initial: ThemeChoice =
      stored === 'dark' || stored === 'light' || stored === 'system' ? stored : 'system';
    setChoice(initial);
    applyDarkClass(resolveDark(initial));

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      const raw = localStorage.getItem(STORAGE_KEY) as ThemeChoice | null;
      if (raw === 'system' || !raw) {
        applyDarkClass(mq.matches);
      }
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  function cycle() {
    const order: ThemeChoice[] = ['system', 'light', 'dark'];
    const next = order[(order.indexOf(choice) + 1) % order.length];
    setChoice(next);
    localStorage.setItem(STORAGE_KEY, next);
    applyDarkClass(resolveDark(next));
  }

  if (!mounted) {
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center rounded-[6px] border border-[var(--border-default)] bg-[var(--bg-root)] ${compact ? 'h-9 w-9' : 'h-10 min-w-[7rem]'}`}
        aria-hidden
      />
    );
  }

  const Icon = choice === 'dark' ? Moon : choice === 'light' ? Sun : Monitor;
  const label =
    choice === 'dark' ? 'Dark theme (click for system)' : choice === 'light' ? 'Light theme (click for dark)' : 'System theme (click for light)';

  return (
    <button
      type="button"
      onClick={cycle}
      title={label}
      aria-label={label}
      className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-[6px] border border-[var(--border-default)] bg-[var(--bg-root)] text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)] ${
        compact ? 'h-9 w-9' : 'h-10 min-w-[7rem] px-3 font-mono text-[12px] font-medium'
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      {!compact && (
        <span className="hidden sm:inline">{choice === 'system' ? 'Auto' : choice === 'dark' ? 'Dark' : 'Light'}</span>
      )}
    </button>
  );
}
