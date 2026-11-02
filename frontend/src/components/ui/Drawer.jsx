import { useEffect } from 'react'

/** Right-hand panel over a dimmed page, below the header (Figma: 680px wide, 844px for the Contractors tab). */
export default function Drawer({ open, onClose, width = 680, header, footer, children, label }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 top-[57px] z-40 bg-[rgba(25,31,36,0.48)]" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        style={{ width }}
        className="absolute bottom-0 right-0 top-0 flex max-w-full flex-col overflow-hidden bg-white shadow-drawer"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {header}
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        {footer}
      </div>
    </div>
  )
}

export function CloseButton({ onClick }) {
  return (
    <button type="button" onClick={onClick} aria-label="Close" className="flex size-[28px] items-center justify-center text-[20px] leading-[20px] text-muted hover:text-ink">
      ✕
    </button>
  )
}
