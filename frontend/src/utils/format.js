// Display formats used in the Figma design. API timestamps are ISO strings in the app's
// timezone (Australia/Melbourne); the wall-clock part is shown as-is so everyone sees the same time.

const ISO = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/

function parts(value) {
  const m = typeof value === 'string' ? value.match(ISO) : null
  if (!m) return null
  return { y: m[1], mo: m[2], d: m[3], h: m[4] !== undefined ? Number(m[4]) : null, mi: m[5] }
}

function clock(p, { pad = true, lower = false } = {}) {
  const h12 = p.h % 12 || 12
  const suffix = p.h < 12 ? 'AM' : 'PM'
  return `${pad ? String(h12).padStart(2, '0') : h12}:${p.mi} ${lower ? suffix.toLowerCase() : suffix}`
}

/** 06-11-2026 */
export function formatDate(value) {
  const p = parts(value)
  return p ? `${p.d}-${p.mo}-${p.y}` : ''
}

/** 28-10-2026 02:10 PM. Variants: { comma: true } → "30-10-2026, 09:12 AM", { lower: true } → "… am" */
export function formatDateTime(value, { comma = false, lower = false } = {}) {
  const p = parts(value)
  if (!p || p.h === null) return formatDate(value)
  return `${p.d}-${p.mo}-${p.y}${comma ? ',' : ''} ${clock(p, { lower })}`
}

/** 05-06-2026 • 12:45 AM (notes) */
export function formatNoteDate(value) {
  const p = parts(value)
  return p && p.h !== null ? `${p.d}-${p.mo}-${p.y} • ${clock(p)}` : ''
}

/** 1:19 PM | 28-12-2025 (activities) */
export function formatActivityDate(value) {
  const p = parts(value)
  return p && p.h !== null ? `${clock(p, { pad: false })} | ${p.d}-${p.mo}-${p.y}` : ''
}

/** 2.1 MB, 0.4 MB, 24 KB */
export function formatSize(bytes) {
  if (!bytes && bytes !== 0) return ''
  if (bytes < 100 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function initial(name) {
  return (name || '?').trim().charAt(0).toUpperCase()
}

export function plural(count, word) {
  return `${count} ${word}${count === 1 ? '' : 's'}`
}

/** Today's date as YYYY-MM-DD in the user's local calendar (for date input minimums). */
export function todayYmd() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}
