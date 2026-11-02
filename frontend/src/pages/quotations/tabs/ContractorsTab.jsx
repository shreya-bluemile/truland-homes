import { useEffect, useRef, useState } from 'react'
import api, { parseApiError } from '../../../api/client'
import dotAwaiting from '../../../assets/figma/dot-awaiting.svg'
import dotNotQuoting from '../../../assets/figma/dot-not-quoting.svg'
import dotReceived from '../../../assets/figma/dot-received.svg'
import downloadIcon from '../../../assets/figma/download.svg'
import { apiUrl, formatDate, formatTime } from '../../../lib/format'

const STATUSES = {
  received: { label: 'Received', dot: dotReceived, pill: 'bg-[#e8f5ed] text-[#27764e]' },
  awaiting: { label: 'Awaiting', dot: dotAwaiting, pill: 'bg-[#fff2d6] text-[#9e6b05]' },
  not_quoting: { label: 'Not Quoting', dot: dotNotQuoting, pill: 'bg-[rgba(128,128,128,0.1)] text-ink-label' },
}
const stamp = (v, lower) => `${formatDate(v)}, ${formatTime(v, { lower })}`
const head = 'border-b-[0.909px] border-line bg-surface-subtle px-[16px] py-[12px] text-left text-[10px] font-bold uppercase text-muted'
const cell = 'border-b-[0.909px] border-line-soft p-[16px] align-middle'

export default function ContractorsTab({ quotation: q, onChanged }) {
  const [busy, setBusy] = useState(null)
  const [notice, setNotice] = useState(null)
  const manualReminders = q.reminder_days === null

  const run = async (id, request, success) => {
    setBusy(id); setNotice(null)
    try {
      const { data } = await request()
      setNotice({ ok: true, text: success || data.message })
      onChanged()
    } catch (e) {
      setNotice({ ok: false, text: parseApiError(e).message })
    } finally {
      setBusy(null)
    }
  }

  if (q.draft) return <p className="p-[22px] text-[12px] text-muted">This quotation is a draft. Contractors will appear here once it’s sent.</p>

  return (
    <div className="p-[22px]">
      {notice && (
        <p role="status" className={`mb-[12px] rounded-[4px] px-[12px] py-[10px] text-[11px] ${notice.ok ? 'bg-[#e8f5ed] text-[#27764e]' : 'bg-[#fdebed] text-brand-bright'}`}>{notice.text}</p>
      )}
      <table className="w-full min-w-[790px] table-fixed border-separate border-spacing-0 overflow-hidden rounded-[4px] border-[0.909px] border-line">
        <colgroup><col className="w-[269px]" /><col className="w-[198px]" /><col className="w-[198px]" /><col className="w-[130px]" /></colgroup>
        <thead>
          <tr><th className={head}>Contractor</th><th className={head}>Sent Details</th><th className={head}>Quote Status</th><th className={`${head} text-right`}>Action</th></tr>
        </thead>
        <tbody>
          {q.recipients.map((r) => (
            <tr key={r.id} className="h-[65.781px] last:[&>td]:border-b-0">
              <td className={cell}>
                <p className="pb-[4px] text-[13px] font-bold text-ink">{r.name}</p>
                <p className="text-[11px] text-muted">{r.email}</p>
              </td>
              <td className={`${cell} text-[10px] text-muted`}>{r.sent_at ? stamp(r.sent_at) : '—'}</td>
              <td className={cell}>
                <div className="flex flex-col items-start gap-[4px]">
                  {r.status === 'quoted' ? (
                    <span className="rounded-[3px] bg-[#e8f5ed] px-[8px] py-[4px] text-[11px] font-bold text-[#27764e]">Quoted</span>
                  ) : (
                    <StatusMenu value={r.status} disabled={busy === r.id}
                      onChange={(status) => run(r.id, () => api.patch(`/quotations/${q.id}/recipients/${r.id}`, { status }), `${r.name} marked as ${STATUSES[status].label}.`)} />
                  )}
                  {r.responded_at && <span className="text-[10px] text-muted">{stamp(r.responded_at, true)}</span>}
                </div>
              </td>
              <td className={`${cell} text-right`}>
                {r.quote && (
                  <a href={apiUrl(`/quotations/${q.id}/recipients/${r.id}/quote`)} title={r.message || `Download ${r.quote.name}`}
                    className="inline-flex h-[25px] items-center gap-[6px] rounded-[3px] border-[0.909px] border-[rgba(51,51,51,0.5)] bg-white px-[8px] text-[10px] font-bold text-[#333] hover:bg-surface-subtle">
                    <img src={downloadIcon} alt="" width="12" height="12" /> Quote
                  </a>
                )}
                {r.status === 'awaiting' && manualReminders && (
                  <button type="button" disabled={busy === r.id} onClick={() => run(r.id, () => api.post(`/quotations/${q.id}/recipients/${r.id}/remind`))}
                    className="h-[25px] min-w-[89.83px] rounded-[3px] border-[0.909px] border-[rgba(51,51,51,0.5)] bg-white px-[8px] text-[10px] font-bold text-[#333] hover:bg-surface-subtle disabled:opacity-60">
                    {busy === r.id ? 'Sending…' : 'Send reminder'}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!manualReminders && (
        <p className="mt-[10px] text-[10px] text-muted">Contractors who haven’t responded are reminded automatically {q.reminder_days} {q.reminder_days === 1 ? 'day' : 'days'} before the due date.</p>
      )}
    </div>
  )
}

/** "Awaiting ▾" pill that opens the Received / Awaiting / Not Quoting menu. */
function StatusMenu({ value, onChange, disabled }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])
  const current = STATUSES[value]

  return (
    <div ref={ref} className="relative">
      <button type="button" disabled={disabled} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}
        className={`whitespace-pre rounded-[3px] px-[7px] py-[4px] text-[11px] font-semibold ${current.pill}`}>
        {`${current.label} ▾`}
      </button>
      {open && (
        <ul role="menu" className="absolute left-[-145px] top-[24px] z-10 w-[220px] overflow-hidden rounded-[6px] border border-line bg-white py-[6px] shadow-menu">
          {Object.entries(STATUSES).map(([key, s]) => (
            <li key={key}>
              <button type="button" role="menuitem" onClick={() => { setOpen(false); if (key !== value) onChange(key) }}
                className={`flex w-full items-center gap-[8px] px-[12px] py-[8px] text-left text-[12px] text-ink hover:bg-surface-panel ${key === value ? 'bg-surface-panel font-semibold' : ''}`}>
                <img src={s.dot} alt="" width="8" height="8" />
                <span className="flex-1">{s.label}</span>
                {key === value && <span className="font-bold text-brand">✓</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
