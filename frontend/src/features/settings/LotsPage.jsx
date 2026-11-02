import { useCallback, useEffect, useState } from 'react'
import api, { parseApiError } from '../../api/client'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Modal from '../../components/ui/Modal'
import { FieldError, FieldLabel } from '../../components/ui/Select'
import { inputClass } from '../../components/ui/inputClass'
import { useToast } from '../../components/ui/useToast'
import Pagination from '../../components/ui/Pagination'
import { PageHeader, SearchInput, Table, linkButton, primaryButton, secondaryButton, td } from '../../components/ui/page'
import { plural } from '../../utils/format'

function LotModal({ lot, onClose, onSaved }) {
  const editing = !!lot
  const [form, setForm] = useState(editing ? { address: lot.address, floor_plan: lot.floor_plan || '' } : { address: '', floor_plan: '' })
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
      const { data } = editing ? await api.put(`/lots/${lot.id}`, form) : await api.post('/lots', form)
      onSaved(data.message || (editing ? 'Lot updated.' : 'Lot added.'))
    } catch (err) {
      const { message, fieldErrors } = parseApiError(err)
      setErrors(fieldErrors)
      setFormError(Object.keys(fieldErrors).length ? '' : message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open title={editing ? 'Edit Lot' : 'Add Lot'} onClose={onClose}>
      <div className="flex flex-col gap-[12px]">
        {formError && <p role="alert" className="rounded-[4px] bg-[#fdebed] px-[12px] py-[10px] text-[11px] text-[#a3000e]">{formError}</p>}
        <div>
          <FieldLabel htmlFor="lot-address" required className="pb-[6px]">Lot Address</FieldLabel>
          <input id="lot-address" value={form.address} onChange={(e) => set('address')(e.target.value)}
            placeholder="e.g. Lot 14, 22 Harbour View Road, Melbourne" className={inputClass(errors.address)} />
          <FieldError>{errors.address}</FieldError>
        </div>
        <div>
          <FieldLabel htmlFor="lot-plan" className="pb-[6px]">Floor plan</FieldLabel>
          <input id="lot-plan" value={form.floor_plan} onChange={(e) => set('floor_plan')(e.target.value)}
            placeholder="e.g. Ground Floor Plan" className={inputClass(errors.floor_plan)} />
          <FieldError>{errors.floor_plan}</FieldError>
          <p className="pt-[4px] text-[10px] text-muted">Shown in the blue notice when the lot is chosen, and in the email to contractors.</p>
        </div>
        <div className="flex justify-end gap-[10px] pt-[6px]">
          <button type="button" onClick={onClose} className={secondaryButton}>Cancel</button>
          <button type="button" onClick={save} disabled={saving} className={primaryButton}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </Modal>
  )
}

export default function LotsPage() {
  const notify = useToast()
  const [search, setSearch] = useState('')
  const [applied, setApplied] = useState('')
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState(null)
  const [lots, setLots] = useState(null)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(null)
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(() => api.get('/lots', { params: { page, ...(applied ? { search: applied } : {}) } })
    .then(({ data }) => { setLots(data.data); setMeta(data.meta); setError('') })
    .catch((err) => setError(parseApiError(err, 'Could not load lots.').message)), [applied, page])
  useEffect(() => { load() }, [load])

  const saved = (message) => { notify(message); setModal(null); load() }

  const confirmDelete = async () => {
    setDeleting(true)
    try {
      const { data } = await api.delete(`/lots/${toDelete.id}`)
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
      <PageHeader title="Lots" subtitle="The lot addresses quotations are raised for.">
        <button type="button" onClick={() => setModal('new')} className={primaryButton}>+ Add Lot</button>
      </PageHeader>

      <div className="flex items-center gap-[10px] pt-[13px]">
        <SearchInput value={search} onChange={setSearch} onEnter={() => { setPage(1); setApplied(search) }} placeholder="Search by address" />
        <button type="button" onClick={() => { setPage(1); setApplied(search) }} className="h-[34px] rounded-[3px] bg-filter px-[22px] text-[12px] font-medium text-white hover:bg-[#4f5151]">Filter</button>
      </div>

      <Table ariaLabel="Lots" loading={lots === null && !error} error={error} onRetry={load} empty="No lots yet."
        columns={[['LOT ADDRESS'], ['FLOOR PLAN', 200], ['QUOTATIONS', 110], ['ACTION', 130]]}>
        {lots?.map((l) => (
          <tr key={l.id}>
            <td className={`${td} font-semibold text-ink`}>{l.address}</td>
            <td className={td}>{l.floor_plan || '—'}</td>
            <td className={td}>{plural(l.quotations_count, 'quotation')}</td>
            <td className={`${td} text-right`}>
              <button type="button" onClick={() => setModal(l)} className={linkButton}>Edit</button>
              <button type="button" onClick={() => setToDelete(l)} className={`${linkButton} ml-[12px] text-brand-bright`}>Delete</button>
            </td>
          </tr>
        ))}
      </Table>

      <Pagination className="mt-[12px]" page={page} lastPage={meta?.last_page} onChange={setPage} />

      {modal && <LotModal lot={modal === 'new' ? null : modal} onClose={() => setModal(null)} onSaved={saved} />}
      <ConfirmDialog open={!!toDelete} title="Delete this lot?" busy={deleting}
        message={`${toDelete?.address} will be removed from the lot list. Lots with quotations can’t be deleted.`}
        onConfirm={confirmDelete} onCancel={() => setToDelete(null)} />
    </section>
  )
}
