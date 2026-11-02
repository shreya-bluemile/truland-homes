const pad = (n) => String(n).padStart(2, '0')

/** "28-10-2026" from an ISO date or date-time. */
export function formatDate(value) {
  if (!value) return ''
  const d = value.length === 10 ? new Date(`${value}T00:00:00`) : new Date(value)
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`
}

/** "02:10 PM" (or "02:10 pm" with lower = true). */
export function formatTime(value, { lower = false, padHour = true } = {}) {
  if (!value) return ''
  const d = new Date(value)
  const h = d.getHours() % 12 || 12
  const time = `${padHour ? pad(h) : h}:${pad(d.getMinutes())} ${d.getHours() < 12 ? 'AM' : 'PM'}`
  return lower ? time.toLowerCase() : time
}

export const formatDateTime = (value, opts) => (value ? `${formatDate(value)} ${formatTime(value, opts)}` : '')

/** "2.1 MB" (small files in KB so they don't read as "0.0 MB"). */
export function formatSize(bytes) {
  const n = Number(bytes || 0)
  return n < 102400 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1048576).toFixed(1)} MB`
}

export const fileKind = (name = '') => (/\.(xlsx?|csv)$/i.test(name) ? 'XLS' : /\.(jpe?g|png)$/i.test(name) ? 'IMG' : /\.docx?$/i.test(name) ? 'DOC' : 'PDF')

/** Absolute URL for a file download through the API. */
export const apiUrl = (path) => `${(import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')}${path}`
