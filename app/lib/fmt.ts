export function fmtAsOf(ms?: number | null){ try{ return ms ? new Date(ms).toLocaleString() : '—'; } catch { return '—'; } }
