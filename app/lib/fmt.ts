
export function fmtAsOf(ms: number | null | undefined) {
  try {
    if (!ms) return '—';
    return new Date(ms).toLocaleString();
  } catch {
    return '—';
  }
}
