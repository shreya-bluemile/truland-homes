import { useEffect, useRef } from 'react'

/** Centred modal for small forms (add/edit contractor, lot, category). */
export default function Modal({ open, title, onClose, children, width = 420 }) {
  const box = useRef(null)
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    box.current?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(25,31,36,0.48)]" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={box} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} style={{ width }}
        className="max-h-[85vh] overflow-y-auto rounded-[6px] bg-white p-[22px] shadow-drawer outline-none">
        <div className="flex items-center justify-between pb-[14px]">
          <h2 className="text-[15px] font-bold text-ink">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-[18px] text-muted hover:text-ink">✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}
