import { useEffect, useRef } from 'react'

/**
 * Right-hand drawer from the Figma frames: dims the whole page and slides in below the header.
 * Closes on Escape or a click on the dimmed area.
 */
export default function Drawer({ open, onClose, width = 680, label, children }) {
  const panel = useRef(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    panel.current?.focus()
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-[rgba(25,31,36,0.48)]" onClick={onClose} aria-hidden="true" />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        style={{ width }}
        className="absolute bottom-0 right-0 top-[57px] flex flex-col overflow-hidden bg-white shadow-drawer outline-none transition-[width] duration-200"
      >
        {children}
      </div>
    </div>
  )
}

export function CloseButton({ onClick }) {
  return (
    <button type="button" onClick={onClick} aria-label="Close"
      className="flex size-[28px] items-center justify-center text-[20px] leading-[20px] text-muted hover:text-ink">
      ✕
    </button>
  )
}
