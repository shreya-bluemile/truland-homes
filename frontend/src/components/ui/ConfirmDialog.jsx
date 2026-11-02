/** Simple "are you sure" dialog for destructive actions. */
export default function ConfirmDialog({ open, title, message, confirmLabel = 'Delete', busy, onConfirm, onCancel }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(25,31,36,0.48)]" role="alertdialog" aria-modal="true" aria-label={title}>
      <div className="w-[380px] rounded-[6px] bg-white p-[22px] shadow-drawer">
        <h2 className="text-[15px] font-bold text-ink">{title}</h2>
        <p className="mt-[8px] text-[12px] leading-[18px] text-ink-sub">{message}</p>
        <div className="mt-[20px] flex justify-end gap-[10px]">
          <button type="button" onClick={onCancel} className="min-h-[30px] rounded-[3px] border-[0.909px] border-[#d8dde1] bg-white px-[14px] text-[11px] text-[#525e67]">Cancel</button>
          <button type="button" onClick={onConfirm} disabled={busy} className="min-h-[30px] rounded-[3px] bg-brand px-[14px] text-[11px] font-bold text-white disabled:opacity-60">
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
