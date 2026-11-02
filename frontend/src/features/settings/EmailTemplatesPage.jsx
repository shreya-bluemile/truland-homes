import { useCallback, useEffect, useState } from 'react'
import api, { parseApiError } from '../../api/client'
import Drawer, { CloseButton } from '../../components/ui/Drawer'
import Pagination from '../../components/ui/Pagination'
import { FilterSelect, FieldError, FieldLabel } from '../../components/ui/Select'
import { inputClass } from '../../components/ui/inputClass'
import { useToast } from '../../components/ui/useToast'
import { ActiveBadge, PageHeader, SearchInput, Table, linkButton, primaryButton, secondaryButton, td } from '../../components/ui/page'

const EMPTY = { name: '', description: '', subject: '', body: '', is_active: true }

function TemplateDrawer({ template, placeholders, onClose, onSaved }) {
  const editing = !!template
  const [form, setForm] = useState(editing
    ? { name: template.name, description: template.description || '', subject: template.subject, body: template.body, is_active: template.is_active }
    : EMPTY)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const set = (key) => (value) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const save = async () => {
    setSaving(true)
    setFormError('')
    try {
      const { data } = editing
        ? await api.put(`/email-templates/${template.id}`, form)
        : await api.post('/email-templates', form)
      onSaved(data.message || (editing ? 'Template updated.' : 'Template created.'))
    } catch (err) {
      const { message, fieldErrors } = parseApiError(err)
      setErrors(fieldErrors)
      setFormError(Object.keys(fieldErrors).length ? 'Please fix the highlighted fields.' : message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Drawer open onClose={onClose} width={720} label={editing ? 'Edit email template' : 'Create email template'}>
      <div className="flex items-center justify-between border-b-[0.909px] border-line px-[22px] py-[16px]">
        <div>
          <h1 className="text-[16px] font-bold text-ink">{editing ? 'Edit Email Template' : 'Create Email Template'}</h1>
          {template?.is_system && <p className="pt-[2px] text-[10px] text-muted">System template: used automatically when quotations are sent. It can be edited but not deactivated.</p>}
        </div>
        <CloseButton onClick={onClose} />
      </div>

      <div className="flex-1 overflow-y-auto p-[22px]">
        <div className="flex flex-col gap-[12px]">
          {formError && <p role="alert" className="rounded-[4px] bg-[#fdebed] px-[12px] py-[10px] text-[11px] text-[#a3000e]">{formError}</p>}
          <div>
            <FieldLabel htmlFor="t-name" required className="pb-[6px]">Name</FieldLabel>
            <input id="t-name" value={form.name} onChange={(e) => set('name')(e.target.value)} className={inputClass(errors.name)} />
            <FieldError>{errors.name}</FieldError>
          </div>
          <div>
            <FieldLabel htmlFor="t-description" className="pb-[6px]">Description</FieldLabel>
            <input id="t-description" value={form.description} onChange={(e) => set('description')(e.target.value)}
              placeholder="What this template is for (shown only in this list)" className={inputClass(errors.description)} />
            <FieldError>{errors.description}</FieldError>
          </div>
          <div>
            <FieldLabel htmlFor="t-subject" required className="pb-[6px]">Subject</FieldLabel>
            <input id="t-subject" value={form.subject} onChange={(e) => set('subject')(e.target.value)} className={inputClass(errors.subject)} />
            <FieldError>{errors.subject}</FieldError>
          </div>
          <div>
            <FieldLabel htmlFor="t-body" required className="pb-[6px]">Body</FieldLabel>
            <textarea id="t-body" rows={14} value={form.body} onChange={(e) => set('body')(e.target.value)}
              className={`${inputClass(errors.body)} resize-y font-mono text-[11px] leading-[17px]`} />
            <FieldError>{errors.body}</FieldError>
          </div>
          <label className="flex cursor-pointer items-center gap-[8px] text-[12px] text-ink">
            <input type="checkbox" className="accent-brand" checked={form.is_active} disabled={template?.is_system}
              onChange={(e) => set('is_active')(e.target.checked)} />
            Active
          </label>

          <div className="rounded-[6px] border border-line bg-surface-panel p-[14px]">
            <h2 className="text-[12px] font-bold text-ink">Placeholders</h2>
            <p className="pt-[2px] text-[10px] text-muted">These are replaced with the quotation’s details when the email is sent. Click one to copy it.</p>
            <dl className="pt-[8px]">
              {Object.entries(placeholders).map(([key, description]) => (
                <div key={key} className="flex items-start gap-[10px] py-[3px]">
                  <dt>
                    <button type="button" onClick={() => navigator.clipboard?.writeText(`{{${key}}}`)}
                      className="rounded-[3px] bg-white px-[6px] py-[2px] font-mono text-[10px] text-[#295cbd] hover:bg-[#e8f2ff]"
                      title="Copy">{`{{${key}}}`}</button>
                  </dt>
                  <dd className="pt-[2px] text-[10px] text-ink-sub">{description}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-[10px] border-t-[0.909px] border-line px-[22px] py-[16px]">
        <button type="button" onClick={onClose} className={secondaryButton}>Cancel</button>
        <button type="button" onClick={save} disabled={saving} className={primaryButton}>
          {saving ? 'Saving…' : editing ? 'Save changes' : 'Create template'}
        </button>
      </div>
    </Drawer>
  )
}

export default function EmailTemplatesPage() {
  const notify = useToast()
  const [draft, setDraft] = useState({ search: '', status: '' })
  const [filters, setFilters] = useState({ search: '', status: '' })
  const [page, setPage] = useState(1)
  const [result, setResult] = useState({ data: [], meta: null, placeholders: {} })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [drawer, setDrawer] = useState(null) // null | 'new' | template

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = Object.fromEntries(Object.entries({ ...filters, page }).filter(([, v]) => v !== ''))
      const { data } = await api.get('/email-templates', { params })
      setResult(data)
      setError('')
    } catch (err) {
      setError(parseApiError(err, 'Could not load email templates.').message)
    } finally {
      setLoading(false)
    }
  }, [filters, page])

  useEffect(() => { load() }, [load])

  const apply = () => { setPage(1); setFilters(draft) }
  const saved = (message) => { notify(message); setDrawer(null); load() }

  return (
    <section>
      <PageHeader title="Email Templates" subtitle="The emails sent to contractors. Placeholders are filled in from each quotation.">
        <button type="button" onClick={() => setDrawer('new')} className={primaryButton}>+ Create Template</button>
      </PageHeader>

      <div className="flex items-center gap-[10px] pt-[13px]">
        <SearchInput value={draft.search} onChange={(v) => setDraft((f) => ({ ...f, search: v }))} onEnter={apply} placeholder="Search by name or description" />
        <FilterSelect value={draft.status} onChange={(v) => setDraft((f) => ({ ...f, status: v }))} aria-label="Status" className="w-[110px]">
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </FilterSelect>
        <button type="button" onClick={apply} className="h-[34px] rounded-[3px] bg-filter px-[22px] text-[12px] font-medium text-white hover:bg-[#4f5151]">Filter</button>
      </div>

      <Table ariaLabel="Email templates" loading={loading} error={error} onRetry={load} empty="No templates match."
        columns={[['NAME', 220], ['DESCRIPTION'], ['SUBJECT'], ['STATUS', 90], ['ACTION', 80]]}>
        {result.data.map((t) => (
          <tr key={t.id}>
            <td className={`${td} font-semibold text-ink`}>
              {t.name}
              {t.is_system && <span className="ml-[8px] rounded-[3px] bg-[#e8f2ff] px-[6px] py-[2px] text-[8px] font-bold text-[#295cbd]">SYSTEM</span>}
            </td>
            <td className={td}>{t.description || '—'}</td>
            <td className={`${td} max-w-[240px] truncate`}>{t.subject}</td>
            <td className={td}><ActiveBadge active={t.is_active} /></td>
            <td className={`${td} text-right`}>
              <button type="button" onClick={() => setDrawer(t)} className={linkButton}>Edit</button>
            </td>
          </tr>
        ))}
      </Table>
      <Pagination className="mt-[12px]" page={page} lastPage={result.meta?.last_page} onChange={setPage} />

      {drawer && (
        <TemplateDrawer template={drawer === 'new' ? null : drawer} placeholders={result.placeholders || {}}
          onClose={() => setDrawer(null)} onSaved={saved} />
      )}
    </section>
  )
}
