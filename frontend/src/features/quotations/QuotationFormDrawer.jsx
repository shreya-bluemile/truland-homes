import { useEffect, useMemo, useRef, useState } from 'react'
import api, { parseApiError } from '../../api/client'
import Drawer, { CloseButton } from '../../components/ui/Drawer'
import { FileTag } from '../../components/ui/Badges'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import FileDropzone from '../../components/ui/FileDropzone'
import MultiSelect from '../../components/ui/MultiSelect'
import { FieldError, FieldLabel, Select } from '../../components/ui/Select'
import { inputClass } from '../../components/ui/inputClass'
import { CalendarIcon } from '../../components/ui/Icons'
import { checkFile, DOCUMENT_EXTENSIONS } from '../../utils/files'
import { formatSize, todayYmd } from '../../utils/format'

const REMINDERS = [
  ['', 'Don’t remind automatically'],
  ['1', 'Automatically remind non-responders 1 day before due date'],
  ['2', 'Automatically remind non-responders 2 days before due date'],
  ['3', 'Automatically remind non-responders 3 days before due date'],
  ['5', 'Automatically remind non-responders 5 days before due date'],
  ['7', 'Automatically remind non-responders 7 days before due date'],
]
const ACCEPT = DOCUMENT_EXTENSIONS.map((e) => `.${e}`).join(',')

let keySeq = 0
const nextKey = () => `doc${++keySeq}`

/** Maps API error keys like "contractor_ids.0" or "files.2" to the form field they belong to. */
function fieldFor(key) {
  if (key.startsWith('contractor_ids')) return 'contractor_ids'
  if (key.startsWith('files') || key.startsWith('template_ids') || key.startsWith('keep_document_ids')) return 'documents'
  return key
}

export default function QuotationFormDrawer({ quotationId, lookups, onClose, onSaved, onDeleted }) {
  const editing = quotationId !== null
  const [form, setForm] = useState({ lot_id: '', contractor_category_id: '', contractor_ids: [], due_date: '', reminder_days: '3', notes: '' })
  const [documents, setDocuments] = useState([]) // {key, source: existing|template|upload, id?, templateId?, file?, name, size, isTemplate}
  const [categoryOptions, setCategoryOptions] = useState({ contractors: [], templates: [] })
  const [loadingDraft, setLoadingDraft] = useState(editing)
  const [loadingCategory, setLoadingCategory] = useState(false)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(null) // 'draft' | 'send' | null
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const fileInput = useRef(null)

  const lot = useMemo(() => lookups.lots.find((l) => String(l.id) === String(form.lot_id)), [lookups.lots, form.lot_id])
  const category = lookups.categories.find((c) => String(c.id) === String(form.contractor_category_id))

  // Load an existing draft.
  useEffect(() => {
    if (!editing) return
    api.get(`/quotations/${quotationId}`).then(({ data: { data: q } }) => {
      setForm({
        lot_id: String(q.lot.id),
        contractor_category_id: q.category ? String(q.category.id) : '',
        contractor_ids: q.contractor_ids,
        due_date: q.due_date || '',
        reminder_days: q.reminder_days ? String(q.reminder_days) : '',
        notes: q.notes || '',
      })
      setDocuments(q.documents.map((d) => ({ key: nextKey(), source: 'existing', id: d.id, name: d.name, size: d.size, isTemplate: d.is_template })))
      if (q.category) loadCategory(q.category.id, { addTemplates: false })
    }).catch((err) => setFormError(parseApiError(err, 'Could not load this draft.').message))
      .finally(() => setLoadingDraft(false))
  }, [editing, quotationId])

  async function loadCategory(categoryId, { addTemplates }) {
    if (!categoryId) { setCategoryOptions({ contractors: [], templates: [] }); return }
    setLoadingCategory(true)
    try {
      const { data } = await api.get(`/lookups/categories/${categoryId}`)
      setCategoryOptions({ contractors: data.contractors, templates: data.templates })
      if (addTemplates) {
        // Swap the previous category's template documents for this category's ones; keep everything else.
        setDocuments((docs) => [
          ...data.templates.map((t) => ({ key: nextKey(), source: 'template', templateId: t.id, name: t.name, size: t.size, isTemplate: true })),
          ...docs.filter((d) => !d.isTemplate),
        ])
      }
    } catch (err) {
      setFormError(parseApiError(err, 'Could not load contractors for this category.').message)
    } finally {
      setLoadingCategory(false)
    }
  }

  const set = (key) => (value) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const changeCategory = (value) => {
    setForm((f) => ({ ...f, contractor_category_id: value, contractor_ids: [] }))
    setErrors((e) => ({ ...e, contractor_category_id: undefined, contractor_ids: undefined }))
    loadCategory(value, { addTemplates: true })
  }

  const addFiles = (files) => {
    const problems = files.map((f) => checkFile(f)).filter(Boolean)
    const ok = files.filter((f) => !checkFile(f))
    setDocuments((docs) => [...docs, ...ok.map((f) => ({ key: nextKey(), source: 'upload', file: f, name: f.name, size: f.size, isTemplate: false }))])
    setErrors((e) => ({ ...e, documents: problems.length ? problems.join(' ') : undefined }))
  }

  const removeDocument = (key) => setDocuments((docs) => docs.filter((d) => d.key !== key))

  function validateForSend() {
    const e = {}
    if (!form.lot_id) e.lot_id = 'Choose the lot address.'
    if (!form.contractor_category_id) e.contractor_category_id = 'Choose a contractor category.'
    if (form.contractor_ids.length === 0) e.contractor_ids = 'Select at least one contractor.'
    if (!form.due_date) e.due_date = 'Choose the due date.'
    else if (form.due_date < todayYmd()) e.due_date = 'The due date can’t be in the past.'
    return e
  }

  async function submit(action) {
    setFormError('')
    const clientErrors = action === 'send' ? validateForSend() : (form.lot_id ? {} : { lot_id: 'Choose the lot address to save a draft.' })
    if (Object.keys(clientErrors).length) { setErrors(clientErrors); return }

    const body = new FormData()
    body.append('action', action)
    body.append('lot_id', form.lot_id)
    if (form.contractor_category_id) body.append('contractor_category_id', form.contractor_category_id)
    form.contractor_ids.forEach((id) => body.append('contractor_ids[]', id))
    if (form.due_date) body.append('due_date', form.due_date)
    if (form.reminder_days) body.append('reminder_days', form.reminder_days)
    if (form.notes.trim()) body.append('notes', form.notes.trim())
    documents.forEach((d) => {
      if (d.source === 'existing') body.append('keep_document_ids[]', d.id)
      if (d.source === 'template') body.append('template_ids[]', d.templateId)
      if (d.source === 'upload') body.append('files[]', d.file)
    })
    if (editing) body.append('_method', 'PUT')

    setSubmitting(action)
    try {
      const { data } = await api.post(editing ? `/quotations/${quotationId}` : '/quotations', body)
      onSaved(data.message, data.data)
    } catch (err) {
      const { message, fieldErrors } = parseApiError(err)
      const mapped = {}
      for (const [key, msg] of Object.entries(fieldErrors)) mapped[fieldFor(key)] ??= msg
      setErrors(mapped)
      setFormError(Object.keys(mapped).length ? 'Please fix the highlighted fields.' : message)
    } finally {
      setSubmitting(null)
    }
  }

  async function deleteDraft() {
    setDeleting(true)
    try {
      const { data } = await api.delete(`/quotations/${quotationId}`)
      onDeleted(data.message)
    } catch (err) {
      setFormError(parseApiError(err).message)
      setConfirmDelete(false)
    } finally {
      setDeleting(false)
    }
  }

  const busy = submitting !== null || loadingDraft

  return (
    <Drawer open onClose={onClose} label={editing ? 'Edit draft quotation' : 'Create Quotation'}>
      <div className="flex items-center justify-between border-b-[0.909px] border-line px-[22px] py-[16px]">
        <h1 className="text-[16px] font-bold text-ink">{editing ? 'Edit Draft Quotation' : 'Create Quotation'}</h1>
        <CloseButton onClick={onClose} />
      </div>

      <div className="flex-1 overflow-y-auto p-[22px]">
        {loadingDraft ? <p className="py-10 text-center text-[12px] text-muted">Loading draft…</p> : (
          <div className="flex flex-col gap-[10px]">
            {formError && <p role="alert" className="rounded-[4px] bg-[#fdebed] px-[12px] py-[10px] text-[11px] text-[#a3000e]">{formError}</p>}

            <div className="flex flex-col gap-[6px]">
              <FieldLabel htmlFor="lot" required>Lot Address</FieldLabel>
              <Select id="lot" value={form.lot_id} onChange={set('lot_id')} invalid={errors.lot_id}>
                <option value="">Select a lot address</option>
                {lookups.lots.map((l) => <option key={l.id} value={l.id}>{l.address}</option>)}
              </Select>
              <FieldError>{errors.lot_id}</FieldError>
              {lot?.floor_plan && (
                <div className="flex gap-[8px] rounded-[4px] bg-[#e8f2ff] px-[12px] py-[10px] text-[#295cbd]">
                  <span className="text-[12px] font-bold">✓</span>
                  <span className="text-[11px]">{lot.floor_plan} is selected.</span>
                </div>
              )}
            </div>

            <div>
              <FieldLabel htmlFor="category" required className="pb-[8px]">Contractor Category</FieldLabel>
              <Select id="category" value={form.contractor_category_id} onChange={changeCategory} invalid={errors.contractor_category_id}>
                <option value="">Select a category</option>
                {lookups.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
              <FieldError>{errors.contractor_category_id}</FieldError>
            </div>

            <div className="flex flex-col gap-[10px]">
              <FieldLabel htmlFor="contractors" required>Contractors</FieldLabel>
              <div>
                <MultiSelect
                  id="contractors"
                  options={categoryOptions.contractors}
                  value={form.contractor_ids}
                  onChange={set('contractor_ids')}
                  disabled={!form.contractor_category_id || loadingCategory}
                  invalid={errors.contractor_ids}
                  placeholder={form.contractor_category_id ? (loadingCategory ? 'Loading contractors…' : 'Select contractors') : 'Choose a category first'}
                />
                <FieldError>{errors.contractor_ids}</FieldError>
              </div>
            </div>

            <div>
              <FieldLabel htmlFor="due" required className="pb-[8px]">Due date</FieldLabel>
              <div className="relative">
                <input id="due" type="date" min={todayYmd()} value={form.due_date} onChange={(e) => set('due_date')(e.target.value)}
                  className={`${inputClass(errors.due_date)} h-[36px] py-0 pr-[34px] [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-[10px] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0`} />
                <CalendarIcon className="pointer-events-none absolute right-[13px] top-1/2 size-3 -translate-y-1/2 text-ink" />
              </div>
              <FieldError>{errors.due_date}</FieldError>
            </div>

            <div>
              <FieldLabel htmlFor="reminder" className="pb-[8px]">Reminder</FieldLabel>
              <Select id="reminder" value={form.reminder_days} onChange={set('reminder_days')} invalid={errors.reminder_days}>
                {REMINDERS.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
              </Select>
              <FieldError>{errors.reminder_days}</FieldError>
            </div>

            <div>
              <FieldLabel htmlFor="notes" className="pb-[8px]">Notes for contractors</FieldLabel>
              <textarea id="notes" rows={2} maxLength={2000} value={form.notes} onChange={(e) => set('notes')(e.target.value)}
                placeholder="Shown in the email under “Notes from our team” (optional)"
                className={`${inputClass(errors.notes)} resize-y`} />
              <FieldError>{errors.notes}</FieldError>
            </div>

            <div className="flex flex-col gap-[14px] rounded-[6px] border border-line bg-surface-panel px-[16px] pb-[16px] pt-[14px]">
              <div className="flex items-center gap-[8px]">
                <h2 className="flex-1 text-[13px] font-bold text-ink">Scope of work{category ? ` – ${category.name}` : ''}</h2>
                {documents.some((d) => d.isTemplate) && (
                  <span className="rounded-[3px] bg-[#e0f5e5] px-[7px] py-[4px] text-[9px] font-semibold text-[#1c7d40]">Auto-loaded</span>
                )}
              </div>
              <div className="flex flex-col gap-[6px]">
                <div className="flex items-center gap-[10px]">
                  <h3 className="flex-1 text-[12px] font-bold text-ink">Documents</h3>
                  <button type="button" onClick={() => fileInput.current?.click()} className="text-[11px] font-semibold text-brand hover:underline">
                    + Add document
                  </button>
                </div>
                <ul className="overflow-hidden rounded-[4px] border border-line-input bg-white">
                  {documents.length === 0 && (
                    <li className="px-[12px] py-[10px] text-[11px] text-muted">
                      {form.contractor_category_id ? 'No documents yet. Upload any plans or specifications below.' : 'Choose a category to load its scope documents.'}
                    </li>
                  )}
                  {documents.map((d, i) => (
                    <li key={d.key} className={`flex items-center gap-[10px] px-[12px] py-[8px] ${i > 0 ? 'border-t border-line' : ''}`}>
                      <FileTag name={d.name} />
                      <span className="truncate text-[12px] text-ink">{d.name}</span>
                      {d.isTemplate && <span className="shrink-0 rounded-[3px] bg-[#e8f2ff] px-[7px] py-[4px] text-[9px] font-semibold text-[#295cbd]">Template</span>}
                      <span className="flex-1" />
                      <span className="shrink-0 text-[11px] text-ink-sub">{formatSize(d.size)}</span>
                      <button type="button" onClick={() => removeDocument(d.key)} aria-label={`Remove ${d.name}`} className="text-[12px] text-ink-sub hover:text-brand">✕</button>
                    </li>
                  ))}
                </ul>
                <FieldError>{errors.documents}</FieldError>
                <h3 className="text-[12px] font-bold text-ink">Upload Document</h3>
                <FileDropzone onFiles={addFiles} accept={ACCEPT} inputRef={fileInput} />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-[10px] border-t-[0.909px] border-line px-[22px] py-[16px]">
        {editing && (
          <button type="button" onClick={() => setConfirmDelete(true)} disabled={busy} className="mr-auto text-[11px] font-semibold text-brand hover:underline">
            Delete draft
          </button>
        )}
        <button type="button" onClick={() => submit('draft')} disabled={busy}
          className="min-h-[30px] rounded-[3px] border-[0.909px] border-[#d8dde1] bg-white px-[14px] py-[8px] text-[11px] text-[#525e67] hover:bg-surface-panel disabled:opacity-60">
          {submitting === 'draft' ? 'Saving…' : 'Save as draft'}
        </button>
        <button type="button" onClick={() => submit('send')} disabled={busy}
          className="min-h-[30px] rounded-[3px] bg-brand px-[14px] py-[8px] text-[11px] font-bold text-white hover:bg-[#e01a29] disabled:opacity-60">
          {submitting === 'send' ? 'Sending…' : 'Send Quotation'}
        </button>
      </div>

      <ConfirmDialog open={confirmDelete} title="Delete this draft?" busy={deleting}
        message="The draft and its uploaded documents will be deleted. This can’t be undone."
        onConfirm={deleteDraft} onCancel={() => setConfirmDelete(false)} />
    </Drawer>
  )
}
