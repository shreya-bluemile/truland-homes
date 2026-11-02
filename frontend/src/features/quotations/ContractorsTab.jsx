import { useEffect, useRef, useState } from 'react'
import api, { parseApiError } from '../../api/client'
import { useToast } from '../../components/ui/useToast'
import { downloadFile } from '../../utils/files'
import { formatDateTime } from '../../utils/format'

const OPTIONS = [
  { value: 'received', label: 'Received', dot: 'bg-[#1c7d40]' },
  { value: 'awaiting', label: 'Awaiting', dot: 'bg-[#b7791f]' },
  { value: 'not_quoting', label: 'Not Quoting', dot: 'bg-[#6b7280]' },
]

const BADGE = {
  Quoted: 'bg-[#e8f5ed] text-[11px] font-bold text-[#27764e] px-[8px]',
  'Replied by email': 'bg-[#fff5df] text-[9px] font-bold text-[#9c6b20] px-[8px]',
  Awaiting: 'bg-[#fff2d6] text-[11px] font-semibold text-[#9e6b05] px-[7px]',
  'Not Quoting': 'bg-[rgba(128,128,128,0.1)] text-[11px] font-semibold text-muted-grey px-[7px]',
}

function StatusMenu({ recipient, onPick, busy }) {
  const [open, setOpen] = useState(false)
  const box = useRef(null)
  useEffect(() => {
    if (!open) return
    const close = (e) => !box.current?.contains(e.target) && setOpen(false)
    const esc = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc) }
  }, [open])

  return (
    <div ref={box} className="relative">
      <button type="button" disabled={busy} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}
        className={`whitespace-pre rounded-[3px] py-[4px] disabled:opacity-60 ${BADGE[recipient.status_label]}`}>
        {busy ? 'Saving…' : `${recipient.status_label}  ▾`}
      </button>
      {open && (
        <ul role="menu" className="absolute left-0 top-[calc(100%+4px)] z-20 w-[220px] overflow-hidden rounded-[6px] border border-line bg-white py-[6px] shadow-menu">
          {OPTIONS.map((o) => {
            const current = o.value === recipient.status
            return (
              <li key={o.value} role="none">
                <button type="button" role="menuitemradio" aria-checked={current}
                  onClick={() => { setOpen(false); if (!current) onPick(o.value) }}
                  className={`flex w-full items-center gap-[8px] px-[12px] py-[8px] text-left text-[12px] text-ink hover:bg-surface-panel ${current ? 'bg-surface-panel font-semibold' : ''}`}>
                  <span className={`size-[8px] rounded-full ${o.dot}`} />
                  <span className="flex-1">{o.label}</span>
                  {current && <span className="font-bold text-brand">✓</span>}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

const actionButton = 'h-[25px] min-w-[90px] whitespace-nowrap rounded-[3px] border-[0.909px] border-[rgba(51,51,51,0.5)] bg-white px-[8px] text-[10px] font-bold text-[#333] hover:bg-surface-panel disabled:opacity-60'

export default function ContractorsTab({ quotation, onChanged }) {
  const notify = useToast()
  const [busy, setBusy] = useState(null) // `${id}:status` | `${id}:remind` | `${id}:download`
  const base = `/quotations/${quotation.id}/recipients`

  const run = async (key, action) => {
    setBusy(key)
    try { await action() } catch (err) { notify(parseApiError(err).message, 'error') } finally { setBusy(null) }
  }

  const changeStatus = (r, status) => run(`${r.id}:status`, async () => {
    await api.patch(`${base}/${r.id}`, { status })
    onChanged()
  })
  const remind = (r) => run(`${r.id}:remind`, async () => {
    const { data } = await api.post(`${base}/${r.id}/remind`)
    notify(data.message)
    onChanged()
  })
  const downloadQuote = (r) => run(`${r.id}:download`, () => downloadFile(`${base}/${r.id}/submission`, r.submission?.name))

  if (quotation.recipients.length === 0) {
    return <p className="p-[22px] text-[12px] text-muted">No contractors were added to this quotation.</p>
  }

  const head = 'flex h-[36px] items-center border-b-[0.909px] border-line bg-surface-subtle px-[16px] text-[10px] font-bold uppercase text-muted'
  return (
    <div className="p-[22px]">
      <div role="table" aria-label="Contractors" className="rounded-[4px] border-[0.909px] border-line">
        <div role="row" className="grid grid-cols-[269px_198px_198px_1fr]">
          <div role="columnheader" className={`${head} rounded-tl-[4px]`}>Contractor</div>
          <div role="columnheader" className={head}>Sent details</div>
          <div role="columnheader" className={head}>Quote status</div>
          <div role="columnheader" className={`${head} justify-end rounded-tr-[4px]`}>Action</div>
        </div>
        {quotation.recipients.map((r, i) => {
          const fromPortal = r.status === 'received' && r.response_source === 'portal'
          return (
            <div key={r.id} role="row"
              className={`grid min-h-[66px] grid-cols-[269px_198px_198px_1fr] ${i < quotation.recipients.length - 1 ? 'border-b-[0.909px] border-line-soft' : ''}`}>
              <div role="cell" className="flex flex-col justify-center p-[16px]">
                <span className="pb-[4px] text-[13px] font-bold text-ink">{r.contractor.name}</span>
                <span className="text-[11px] text-muted">{r.contractor.email}</span>
              </div>
              <div role="cell" className="flex items-center p-[16px] text-[10px] text-muted">
                {r.sent_at ? formatDateTime(r.sent_at, { comma: true }) : 'Not sent'}
              </div>
              <div role="cell" className="flex flex-col items-start justify-center gap-[4px] p-[16px]">
                {fromPortal
                  ? <span className={`rounded-[3px] py-[4px] ${BADGE.Quoted}`}>Quoted</span>
                  : <StatusMenu recipient={r} busy={busy === `${r.id}:status`} onPick={(s) => changeStatus(r, s)} />}
                {r.responded_at && r.status !== 'awaiting' && (
                  <span className="text-[10px] text-muted">{formatDateTime(r.responded_at, { comma: true, lower: true })}</span>
                )}
              </div>
              <div role="cell" className="flex flex-col items-end justify-center gap-[3px] p-[16px]">
                {fromPortal && (
                  <button type="button" className={actionButton} disabled={busy === `${r.id}:download`} onClick={() => downloadQuote(r)}
                    title={r.submission?.message ? `Message: ${r.submission.message}` : undefined}>
                    {busy === `${r.id}:download` ? 'Downloading…' : 'Download quote'}
                  </button>
                )}
                {r.status === 'awaiting' && (
                  <>
                    <button type="button" className={actionButton} disabled={busy === `${r.id}:remind`} onClick={() => remind(r)}>
                      {busy === `${r.id}:remind` ? 'Sending…' : 'Send reminder'}
                    </button>
                    {r.last_reminded_at && <span className="text-[9px] text-muted">Reminded {formatDateTime(r.last_reminded_at, { comma: true })}</span>}
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
      {quotation.recipients.some((r) => r.submission?.message) && (
        <div className="mt-[16px] space-y-[8px]">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.5px] text-muted">Messages from contractors</h3>
          {quotation.recipients.filter((r) => r.submission?.message).map((r) => (
            <p key={r.id} className="rounded-[4px] border border-line bg-surface-subtle px-[12px] py-[8px] text-[11px] text-ink">
              <span className="font-semibold">{r.contractor.name}:</span> {r.submission.message}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
