import api from '../api/client'

/** Matches the backend rules: PDF, Word, Excel, CSV, JPG, PNG up to 10 MB. */
export const DOCUMENT_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'jpg', 'jpeg', 'png']
export const QUOTE_EXTENSIONS = ['pdf', 'xls', 'xlsx', 'csv', 'doc', 'docx']
export const MAX_FILE_BYTES = 10 * 1024 * 1024

export const extensionOf = (name = '') => (name.includes('.') ? name.split('.').pop().toLowerCase() : '')

/** Returns an error message for a file the server would reject, or null. */
export function checkFile(file, allowed = DOCUMENT_EXTENSIONS) {
  if (!allowed.includes(extensionOf(file.name))) {
    return `${file.name}: only ${allowed.map((e) => e.toUpperCase()).join(', ')} files can be uploaded.`
  }
  if (file.size > MAX_FILE_BYTES) return `${file.name} is larger than 10 MB.`
  return null
}

/** Short type label and colours for the coloured tag in front of a file name. */
export function fileKind(name) {
  const ext = extensionOf(name)
  if (ext === 'pdf') return { label: 'PDF', className: 'bg-[#ffe8e8] text-brand' }
  if (['xls', 'xlsx', 'csv'].includes(ext)) return { label: ext === 'csv' ? 'CSV' : 'XLS', className: 'bg-[#e0f5e5] text-[#1c7d40]' }
  if (['doc', 'docx'].includes(ext)) return { label: 'DOC', className: 'bg-[#e8f2ff] text-[#295cbd]' }
  if (['jpg', 'jpeg', 'png'].includes(ext)) return { label: 'IMG', className: 'bg-page text-ink-sub' }
  return { label: 'FILE', className: 'bg-page text-ink-sub' }
}

function filenameFrom(disposition, fallback) {
  if (!disposition) return fallback
  const utf8 = disposition.match(/filename\*=utf-8''([^;]+)/i)
  if (utf8) return decodeURIComponent(utf8[1])
  const plain = disposition.match(/filename="?([^";]+)"?/i)
  return plain ? plain[1] : fallback
}

/** Downloads a file from an API endpoint and saves it with the server's file name. */
export async function downloadFile(url, fallbackName = 'download') {
  const response = await api.get(url, { responseType: 'blob' })
  const name = filenameFrom(response.headers['content-disposition'], fallbackName)
  const href = URL.createObjectURL(response.data)
  const link = document.createElement('a')
  link.href = href
  link.download = name
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(href), 1000)
}
