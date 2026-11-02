import { useEffect, useRef, useState } from 'react'
import api, { parseApiError } from '../../api/client'
import calendarIcon from '../../assets/figma/calendar.svg'
import chevron from '../../assets/figma/chevron-down.svg'
import { FileTypeBadge } from '../../components/ui/Badges'
import Drawer, { CloseButton } from '../../components/ui/Drawer'
import Dropzone from '../../components/ui/Dropzone'
import { FieldError, FieldLabel, SelectField } from '../../components/ui/SelectField'
import { formatSize } from '../../lib/format'

const REMINDER_OPTIONS = [
  [3, 'Automatically remind non-responders 3 days before due date'],
  [1, 'Automatically remind non-responders 1 day before due date'],
  [2, 'Automatically remind non-responders 2 days before due date'],
  [5, 'Automatically remind non-responders 5 days before due date'],
  [7, 'Automatically remind non-responders 7 days before due date'],
  ['', 'Don’t remind automatically (send reminders manually)'],
]
const ACCEPT = '.pdf,.xls,.xlsx,.csv,.doc,.docx,.jpg,.jpeg,.png'
const EMPTY = { lot_id: '', contractor_category_id: '', contractor_ids: [], due_date: '', reminder_days: 3 }
let uid = 0

/** Create Quotation drawer. With quotationId it edits a saved draft. */
export default function QuotationFormDrawer({ open, quotationId, options, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY)
  const [docs, setDocs] = useState([])
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState('')
  const [loading, setLoading] = useState(false)
  const addInput = useRef(null)

  const lot = options.lots.find((l) => String(l.id) === String(form.lot_id))
  const category = options.categories.find((c) => String(c.id) === String(form.contractor_category_id))

  useEffect(() => {
    if (!open) return
    setErrors({}); setMessage(''); setSaving('')
    if (!quotationId) { setForm(EMPTY); setDocs([]); return }
    setLoading(true)
    api.get(`/quotations/${quotationId}`).then(({ data: { data: q } }) => {
      setForm({
        lot_id: q.lot_id, contractor_category_id: q.contractor_category_id, due_date: q.due_date || '',
        contractor_ids: q.recipients.map((r) => r.contractor_id), reminder_days: q.reminder_days ?? '',
      })
      setDocs(q.documents.map((d) => ({
        key: `e${d.id}`, kind: 'existing', id: d.id, name: d.name, size: d.size, template: d.source === 'template', fromLot: d.source === 'lot',
      })))
    }).catch((e) => setMessage(parseApiError(e).message)).finally(() => setLoading(false))
  }, [open, quotationId])

  const set = (key, value) => { setForm((f) => ({ ...f, [key]: value })); setErrors((e) => ({ ...e, [key]: undefined })) }

  const chooseLot = (id) => {
    set('lot_id', id)
    const next = options.lots.find((l) => String(l.id) === String(id))
    setDocs((list) => [
      ...(next?.documents || []).map((d) => ({ key: `l${d.id}`, kind: 'lot', id: d.id, name: d.name, size: d.size })),
      ...list.filter((d) => d.kind !== 'lot' && !d.fromLot),
    ])
  }

  const chooseCategory = (id) => {
    setForm((f) => ({ ...f, contractor_category_id: id, contractor_ids: [] }))
    const next = options.categories.find((c) => String(c.id) === String(id))
    setDocs((list) => [
      ...list.filter((d) => d.kind !== 'template' && !(d.kind === 'existing' && d.template)),
      ...(next?.documents || []).map((d) => ({ key: `t${d.id}`, kind: 'template', id: d.id, name: d.name, size: d.size, template: true })),
    ])
  }

  const addFiles = (files) => {
    const tooBig = files.filter((f) => f.size > 10 * 1024 * 1024)
    if (tooBig.length) setMessage(`${tooBig.map((f) => f.name).join(', ')} is larger than 10MB.`)
    setDocs((list) => [...list, ...files.filter((f) => !tooBig.includes(f)).map((file) => ({ key: `n${++uid}`, kind: 'new', file, name: file.name, size: file.size }))])
  }

  const submit = async (action) => {
    setSaving(action); setMessage(''); setErrors({})
    const body = new FormData()
    body.append('action', action)
    for (const key of ['lot_id', 'contractor_category_id', 'due_date']) body.append(key, form[key] ?? '')
    if (form.reminder_days !== '') body.append('reminder_days', form.reminder_days)
    form.contractor_ids.forEach((id) => body.append('contractor_ids[]', id))
    const ids = { lot: 'lot_document_ids[]', template: 'template_document_ids[]', existing: 'document_ids[]' }
    docs.forEach((d) => (d.kind === 'new' ? body.append('files[]', d.file) : body.append(ids[d.kind], d.id)))
    try {
      const { data } = await api.post(quotationId ? `/quotations/${quotationId}` : '/quotations', body)
      onSaved(data.data, action === 'send')
    } catch (e) {
      const { message: msg, fieldErrors } = parseApiError(e)
      setErrors(fieldErrors)
      setMessage(Object.keys(fieldErrors).some((k) => k.startsWith('files')) ? Object.values(fieldErrors)[0] : msg)
    } finally {
      setSaving('')
    }
  }

  const header = (
    <div className="flex items-center justify-between border-b-[0.909px] border-line px-[22px] py-[16px]">
      <h1 className="text-[16px] font-bold text-ink">{quotationId ? 'Edit Draft Quotation' : 'Create Quotation'}</h1>
      <CloseButton onClick={onClose} />
    </div>
  )
  const footer = (
    <div className="flex justify-end gap-[10px] border-t-[0.909px] border-line px-[22px] py-[16px]">
      <button type="button" disabled={Boolean(saving) || loading} onClick={() => submit('draft')}
        className="min-h-[30px] rounded-[3px] border-[0.909px] border-[#d8dde1] bg-white px-[14px] py-[8px] text-[11px] text-[#525e67] hover:bg-surface-subtle disabled:opacity-60">
        {saving === 'draft' ? 'Saving…' : 'Save as draft'}
      </button>
      <button type="button" disabled={Boolean(saving) || loading} onClick={() => submit('send')}
        className="min-h-[30px] rounded-[3px] bg-brand px-[14px] py-[8px] text-[11px] font-bold text-white hover:bg-brand-dark disabled:opacity-60">
        {saving === 'send' ? 'Sending…' : 'Send Quotation'}
      </button>
    </div>
  )

  return (
    <Drawer open={open} onClose={onClose} header={header} footer={footer} label="Create Quotation">
      <div className="flex flex-col gap-[10px] p-[22px]">
        {message && <p role="alert" className="rounded-[4px] bg-[#fdebed] px-[12px] py-[10px] text-[11px] text-brand-bright">{message}</p>}

        <div className="flex flex-col gap-[6px]">
          <FieldLabel required>Lot Address</FieldLabel>
          <SelectField value={form.lot_id} onChange={chooseLot} invalid={errors.lot_id} aria-label="Lot address">
            <option value="">Select a lot</option>
            {options.lots.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
          </SelectField>
          <FieldError>{errors.lot_id}</FieldError>
          {lot?.floor_plan && (
            <p className="flex gap-[8px] rounded-[4px] bg-[#e8f2ff] px-[12px] py-[10px] text-[11px] text-[#295cbd]">
              <span className="text-[12px] font-bold">✓</span> {lot.floor_plan} is selected.
            </p>
          )}
        </div>

        <div>
          <FieldLabel required className="pb-[8px]">Contractor Category</FieldLabel>
          <SelectField value={form.contractor_category_id} onChange={chooseCategory} invalid={errors.contractor_category_id} aria-label="Contractor category">
            <option value="">Select a category</option>
            {options.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </SelectField>
          <FieldError>{errors.contractor_category_id}</FieldError>
        </div>

        <div className="flex flex-col gap-[10px]">
          <FieldLabel required>Contractors</FieldLabel>
          <ContractorPicker
            contractors={category?.contractors || []}
            value={form.contractor_ids}
            onToggle={(id) => {
              setForm((f) => ({ ...f, contractor_ids: f.contractor_ids.includes(id) ? f.contractor_ids.filter((v) => v !== id) : [...f.contractor_ids, id] }))
              setErrors((e) => ({ ...e, contractor_ids: undefined }))
            }}
            invalid={errors.contractor_ids}
            disabled={!category}
          />
          <FieldError>{errors.contractor_ids || errors['contractor_ids.0']}</FieldError>
        </div>

        <div>
          <FieldLabel required className="pb-[8px]">Due date</FieldLabel>
          <DateField value={form.due_date} onChange={(v) => set('due_date', v)} invalid={errors.due_date} />
          <FieldError>{errors.due_date}</FieldError>
        </div>

        <div>
          <FieldLabel className="pb-[8px]">Reminder</FieldLabel>
          <SelectField value={form.reminder_days} onChange={(v) => set('reminder_days', v)} aria-label="Reminder">
            {REMINDER_OPTIONS.map(([v, label]) => <option key={label} value={v}>{label}</option>)}
          </SelectField>
        </div>

        {category && (
          <div className="flex flex-col gap-[14px] rounded-[6px] border border-line bg-surface-panel px-[16px] pb-[16px] pt-[14px]">
            <div className="flex items-center gap-[8px]">
              <h2 className="flex-1 text-[13px] font-bold text-ink">Scope of work – {category.name}</h2>
              <span className="rounded-[3px] bg-[#e0f5e5] px-[7px] py-[4px] text-[9px] font-semibold text-[#1c7d40]">Auto-loaded</span>
            </div>
            <div className="flex flex-col gap-[6px]">
              <div className="flex items-center">
                <h3 className="flex-1 text-[12px] font-bold text-ink">Documents</h3>
                <button type="button" onClick={() => addInput.current?.click()} className="text-[11px] font-semibold text-brand hover:underline">+ Add document</button>
                <input ref={addInput} type="file" hidden multiple accept={ACCEPT} onChange={(e) => { addFiles(Array.from(e.target.files)); e.target.value = '' }} />
              </div>
              {docs.length > 0 ? (
                <ul className="overflow-hidden rounded-[4px] border border-line-input bg-white">
                  {docs.map((d) => (
                    <li key={d.key} className="flex items-center gap-[10px] border-t border-line px-[12px] py-[8px] first:border-t-0">
                      <FileTypeBadge name={d.name} />
                      <span className="truncate text-[12px] text-ink">{d.name}</span>
                      {d.template && <span className="shrink-0 rounded-[3px] bg-[#e8f2ff] px-[7px] py-[4px] text-[9px] font-semibold text-[#295cbd]">Template</span>}
                      <span className="flex-1" />
                      <span className="shrink-0 text-[11px] text-ink-sub">{formatSize(d.size)}</span>
                      <button type="button" aria-label={`Remove ${d.name}`} onClick={() => setDocs((l) => l.filter((x) => x.key !== d.key))} className="text-[12px] text-ink-sub hover:text-brand">✕</button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-[4px] border border-line-input bg-white px-[12px] py-[10px] text-[11px] text-muted">No documents attached.</p>
              )}
              <h3 className="text-[12px] font-bold text-ink">Upload Document</h3>
              <Dropzone onFiles={addFiles} accept={ACCEPT} label="Upload document" />
            </div>
          </div>
        )}
      </div>
    </Drawer>
  )
}

/** Multi-select with chips, styled as the Figma "Contractors" dropdown. */
function ContractorPicker({ contractors, value, onToggle, invalid, disabled }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])
  const selected = contractors.filter((c) => value.includes(c.id))

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Contractors"
        onClick={() => setOpen((o) => !o)}
        className={`flex min-h-[36px] w-full items-center gap-[5px] rounded-[4px] border-[0.909px] bg-white px-[13px] py-[6px] text-left disabled:cursor-not-allowed disabled:bg-surface-subtle ${invalid ? 'border-brand' : 'border-line-input'}`}
      >
        <span className="flex flex-1 flex-wrap gap-[5px]">
          {selected.length === 0 && <span className="text-[12px] text-muted">{disabled ? 'Select a category first' : 'Select contractors'}</span>}
          {selected.map((c) => <span key={c.id} className="rounded-[2px] bg-page px-[7px] py-[4px] text-[10px] text-ink-sub">{c.name}</span>)}
        </span>
        <img src={chevron} alt="" width="16" height="16" />
      </button>
      {open && (
        <ul role="listbox" aria-multiselectable="true" className="absolute left-0 right-0 z-10 mt-[2px] max-h-[220px] overflow-y-auto rounded-[6px] border border-line bg-white py-[6px] shadow-menu">
          {contractors.length === 0 && <li className="px-[12px] py-[8px] text-[12px] text-muted">No contractors in this category.</li>}
          {contractors.map((c) => (
            <li key={c.id}>
              <label className="flex cursor-pointer items-center gap-[8px] px-[12px] py-[8px] text-[12px] text-ink hover:bg-surface-panel">
                <input type="checkbox" className="accent-brand" checked={value.includes(c.id)} onChange={() => onToggle(c.id)} />
                <span className="flex-1">{c.name}</span>
                <span className="text-[11px] text-muted">{c.email}</span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function DateField({ value, onChange, invalid }) {
  const input = useRef(null)
  return (
    <div className="relative">
      <input
        ref={input}
        type="date"
        value={value}
        min={new Date().toISOString().slice(0, 10)}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Due date"
        className={`date-plain h-[35.818px] w-full rounded-[4px] border-[0.909px] bg-white px-[13px] text-[12px] text-ink outline-none focus:border-brand ${invalid ? 'border-brand' : 'border-line-input'}`}
      />
      <button type="button" aria-label="Open calendar" onClick={() => input.current?.showPicker?.()} className="absolute right-[13px] top-1/2 flex size-[12px] -translate-y-1/2 items-center justify-center">
        <img src={calendarIcon} alt="" width="9.74" height="10.59" />
      </button>
    </div>
  )
}
