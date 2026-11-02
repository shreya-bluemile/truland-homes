// Inline SVG icons matching the Figma icon set (mdi chevron, akar download, cuida/iconamoon style lines).
const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' }

export const ChevronDown = ({ className = 'size-4' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true"><path fill="currentColor" d="M7.41 8.58 12 13.17l4.59-4.59L18 10l-6 6-6-6z" /></svg>
)
export const CalendarIcon = ({ className = 'size-3' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...base}><rect x="3.5" y="5" width="17" height="15.5" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4" /></svg>
)
export const DownloadIcon = ({ className = 'size-3' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...base} strokeWidth="2"><path d="M12 4v12m0 0 4-4m-4 4-4-4M5 20h14" /></svg>
)
export const UploadCloud = ({ className = 'h-[30px] w-[42px]' }) => (
  <svg viewBox="0 0 48 34" className={className} aria-hidden="true" fill="none" stroke="#b8b8b8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 27H11a8 8 0 0 1-.9-15.95A11 11 0 0 1 31.4 8.2 8.5 8.5 0 1 1 36.5 27H34" />
    <path d="M24 30V15m0 0-5 5m5-5 5 5" />
  </svg>
)
export const PencilBox = ({ className = 'h-[22px] w-[26px]' }) => (
  <svg viewBox="0 0 26 22" className={className} aria-hidden="true">
    <rect x="5" y="3" width="16" height="16" rx="3" fill="none" stroke="#222" strokeWidth="1.3" />
    <path d="m10 14.5.6-2.4 4.7-4.7a1.2 1.2 0 0 1 1.7 1.7l-4.7 4.7-2.3.7Z" fill="#222" />
  </svg>
)
export const TrashIcon = ({ className = 'size-[13px]' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...base} stroke="#ff3661" strokeWidth="2"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></svg>
)
export const FileIcon = ({ className = 'h-[12px] w-[10px]' }) => (
  <svg viewBox="0 0 10 12" className={className} aria-hidden="true"><path d="M1.5 0h4.6L9.5 3.4V11a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1V1a1 1 0 0 1 1-1Z" fill="#191c1e" /><path d="M6 0v3.5h3.5" fill="#fff" opacity=".5" /><path d="M2.5 6.5h5M2.5 8.5h5" stroke="#fff" strokeWidth=".8" /></svg>
)
export const ImageIcon = ({ className = 'size-[11px]' }) => (
  <svg viewBox="0 0 12 12" className={className} aria-hidden="true"><rect x=".6" y=".6" width="10.8" height="10.8" rx="1.4" fill="none" stroke="#191c1e" strokeWidth="1.2" /><circle cx="4" cy="4" r="1.1" fill="#191c1e" /><path d="m1.2 10 3.3-3.4 2 2 1.6-1.6L11 10" fill="none" stroke="#191c1e" strokeWidth="1.1" /></svg>
)
export const PlusIcon = ({ className = 'size-2' }) => (
  <svg viewBox="0 0 10 10" className={className} aria-hidden="true"><path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
)
export const ClipboardCheck = ({ className = 'size-[17px]' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...base} stroke="#5b6b8c" strokeWidth="1.8"><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4V3h6v1M9 13l2 2 4-4" /></svg>
)
export const CheckIcon = ({ className = 'size-5' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...base} strokeWidth="2.6"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
)
