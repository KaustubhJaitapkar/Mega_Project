/**
 * Strip common rich-text/HTML from organizer-provided fields for plain UI copy.
 */
export function stripRichText(html: string): string {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * If the whole string is identical substring repeats (e.g. pasted HTML blocks),
 * return a single copy: "ABCABCABC" → "ABC".
 */
export function collapseRepeatedRun(text: string): string {
  const w = text.trim();
  if (w.length < 2) return w;
  for (let unitLen = 1; unitLen <= Math.floor(w.length / 2); unitLen++) {
    if (w.length % unitLen !== 0) continue;
    const unit = w.slice(0, unitLen);
    let ok = true;
    for (let i = unitLen; i < w.length; i += unitLen) {
      if (w.slice(i, i + unitLen) !== unit) {
        ok = false;
        break;
      }
    }
    if (ok) return unit.trim();
  }
  return w;
}

/** Strip HTML then collapse accidental full-string duplication (common WYSIWYG paste issue). */
export function plainTextFromRichDescription(html: string): string {
  return collapseRepeatedRun(stripRichText(html));
}
