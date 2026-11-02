import { useCallback, useEffect, useState } from 'react'
import api, { parseApiError } from '../../api/client'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Modal from '../../components/ui/Modal'
import Pagination from '../../components/ui/Pagination'
import { FilterSelect, FieldError, FieldLabel } from '../../components/ui/Select'
import { inputClass } from '../../components/ui/inputClass'
import { useToast } from '../../components/ui/useToast'
import { ActiveBadge, PageHeader, SearchInput, Table, linkButton, primaryButton, secondaryButton, td } from '../../components/ui/page'
import useLookups from '../../hooks/useLookups'

const EMPTY = { name: '', email: '', contractor_category_id: '', is_active: true }

function ContractorModal({ contractor, categories, onClose, onSaved }) {
  const editing = !!contractor
  const [form, setForm] = useState(editing
    ? { name: contractor.name, email: contractor.email, contractor_category_id: String(contractor.category.id), is_active: contractor.is_active }
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
        ? await api.put(`/contractors/${contractor.id}`, form)
        : await api.post('/contractors', form)
      onSaved(data.message)
    } catch (err) {
      const { message, fieldErrors } = parseApiError(err)
      setErrors(fieldErrors)
      setFormError(Object.keys(fieldErrors).length ? '' : message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open title={editing ? 'Edit Contractor' : 'Add Contractor'} onClose={onClose}>
      <div className="flex flex-col gap-[12px]">
        {formError && <p role="alert" className="rounded-[4px] bg-[#fdebed] px-[12px] py-[10px] text-[11px] text-[#a3000e]">{formError}</p>}
        <div>
          <FieldLabel htmlFor="c-name" required className="pb-[6px]">Name</FieldLabel>
          <input id="c-name" value={form.name} onChange={(e) => set('name')(e.target.value)} className={inputClass(errors.name)} />
          <FieldError>{errors.name}</FieldError>
        </div>
        <div>
          <FieldLabel htmlFor="c-email" required className="pb-[6px]">Email</FieldLabel>
          <input id="c-email" type="email" value={form.email} onChange={(e) => set('email')(e.target.value)} className={inputClass(errors.email)} />
          <FieldError>{errors.email}</FieldError>
        </div>
        <div>
          <FieldLabel htmlFor="c-category" required className="pb-[6px]">Contractor Category</FieldLabel>
          <div className="relative">
            <select id="c-category" value={form.contractor_category_id} onChange={(e) => set('contractor_category_id')(e.target.value)}
              className={`${inputClass(errors.contractor_category_id)} h-[36px] cursor-pointer appearance-none py-0`}>
              <option value="">Select a category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <FieldError>{errors.contractor_category_id}</FieldError>
        </div>
        <label className="flex cursor-pointer items-center gap-[8px] text-[12px] text-ink">
          <input type="checkbox" className="accent-brand" checked={form.is_active} onChange={(e) => set('is_active')(e.target.checked)} />
          Active (can be added to new quotations)
        </label>
        <div className="flex justify-end gap-[10px] pt-[6px]">
          <button type="button" onClick={onClose} className={secondaryButton}>Cancel</button>
          <button type="button" onClick={save} disabled={saving} className={primaryButton}>
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Add contractor'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default function ContractorsPage() {
  const notify = useToast()
  const { categories } = useLookups()
  const [draft, setDraft] = useState({ search: '', category_id: '' })
  const [filters, setFilters] = useState({ search: '', category_id: '' })
  const [page, setPage] = useState(1)
  const [result, setResult] = useState({ data: [], meta: null })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(null) // null | 'new' | contractor
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = Object.fromEntries(Object.entries({ ...filters, page }).filter(([, v]) => v !== ''))
      const { data } = await api.get('/contractors', { params })
      setResult(data)
      setError('')
    } catch (err) {
      setError(parseApiError(err, 'Could not load contractors.').message)
    } finally {
      setLoading(false)
    }
  }, [filters, page])

  useEffect(() => { load() }, [load])

  const apply = () => { setPage(1); setFilters(draft) }
  const saved = (message) => { notify(message); setModal(null); load() }

  const confirmDelete = async () => {
    setDeleting(true)
    try {
      const { data } = await api.delete(`/contractors/${toDelete.id}`)
      notify(data.message)
      setToDelete(null)
      load()
    } catch (err) {
      notify(parseApiError(err).message, 'error')
      setToDelete(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <section>
      <PageHeader title="Contractors" subtitle="The people quotation requests are emailed to.">
        <button type="button" onClick={() => setModal('new')} className={primaryButton}>+ Add Contractor</button>
      </PageHeader>

      <div className="flex items-center gap-[10px] pt-[13px]">
        <SearchInput value={draft.search} onChange={(v) => setDraft((f) => ({ ...f, search: v }))} onEnter={apply} placeholder="Search by name or email" />
        <FilterSelect value={draft.category_id} onChange={(v) => setDraft((f) => ({ ...f, category_id: v }))} aria-label="Category" className="w-[126px]">
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </FilterSelect>
        <button type="button" onClick={apply} className="h-[34px] rounded-[3px] bg-filter px-[22px] text-[12px] font-medium text-white hover:bg-[#4f5151]">Filter</button>
      </div>

      <Table ariaLabel="Contractors" loading={loading} error={error} onRetry={load}
        empty="No contractors yet. Add the businesses you request quotes from."
        columns={[['NAME'], ['EMAIL'], ['CATEGORY', 140], ['STATUS', 90], ['ACTION', 130]]}>
        {result.data.map((c) => (
          <tr key={c.id}>
            <td className={`${td} font-semibold text-ink`}>{c.name}</td>
            <td className={td}>{c.email}</td>
            <td className={td}>{c.category.name}</td>
            <td className={td}><ActiveBadge active={c.is_active} /></td>
            <td className={`${td} text-right`}>
              <button type="button" onClick={() => setModal(c)} className={linkButton}>Edit</button>
              <button type="button" onClick={() => setToDelete(c)} className={`${linkButton} ml-[12px] text-brand-bright`}>Delete</button>
            </td>
          </tr>
        ))}
      </Table>
      <Pagination className="mt-[12px]" page={page} lastPage={result.meta?.last_page} onChange={setPage} />

      {modal && (
        <ContractorModal contractor={modal === 'new' ? null : modal} categories={categories}
          onClose={() => setModal(null)} onSaved={saved} />
      )}
      <ConfirmDialog open={!!toDelete} title={`Delete ${toDelete?.name}?`} busy={deleting}
        message="They will disappear from this list and can’t be added to new quotations. Quotations already sent to them keep their history."
        onConfirm={confirmDelete} onCancel={() => setToDelete(null)} />
    </section>
  )
}
