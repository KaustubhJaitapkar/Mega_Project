type HackathonMeta = {
  maxTeams?: number;
  lockSubmissions?: boolean;
  judgingOpen?: boolean;
  blindMode?: boolean;
  anonymousMap?: Record<string, string>;
  channels?: string[];
};

export function parseHackathonMeta(rules?: string | null): HackathonMeta {
  if (!rules) return {};
  const marker = '\n\n---META---\n';
  const idx = rules.indexOf(marker);
  if (idx === -1) return {};
  const raw = rules.slice(idx + marker.length);
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function mergeHackathonMeta(rules: string | null | undefined, meta: HackathonMeta): string {
  const marker = '\n\n---META---\n';
  const text = (rules || '').split(marker)[0];
  return `${text}${marker}${JSON.stringify(meta)}`;
}

