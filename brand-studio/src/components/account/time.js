// "Edited 3 hours ago" style relative time for dashboard cards.
const UNITS = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
]

export function relativeTime(iso, now = Date.now()) {
  if (!iso) return ''
  const diff = Math.round((new Date(iso).getTime() - now) / 1000)
  const abs = Math.abs(diff)
  if (abs < 45) return 'just now'
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  for (const [unit, secs] of UNITS) {
    if (abs >= secs) return rtf.format(Math.round(diff / secs), unit)
  }
  return rtf.format(Math.round(diff / 60), 'minute')
}

export const initials = (name = '') =>
  name.split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((s) => s[0].toUpperCase()).join('') || '?'
