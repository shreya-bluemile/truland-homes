import { useCallback, useEffect, useRef, useState } from 'react'
import api, { parseApiError } from '../../api/client'
import { FileTag } from '../../components/ui/Badges'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Modal from '../../components/ui/Modal'
import { FieldError, FieldLabel } from '../../components/ui/Select'
import { inputClass } from '../../components/ui/inputClass'
import { useToast } from '../../components/ui/useToast'
import { PageHeader, Table, linkButton, primaryButton, secondaryButton, td } from '../../components/ui/page'
import { checkFile, DOCUMENT_EXTENSIONS, downloadFile } from '../../utils/files'
import { formatSize, plural } from '../../utils/format'

const ACCEPT = DOCUMENT_EXTENSIONS.map((e) => `.${e}`).join(',')

function CategoryModal({ category, onClose, onSaved }) {
  const editing = !!category
  const [name, setName] = useState(editing ? category.name : '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      const { data } = editing
        ? await api.put(`/contractor-categories/${category.id}`, { name })
        : await api.post('/contractor-categories', { name })
      onSaved(data.message || (editing ? 'Category updated.' : 'Category added.'))
    } catch (err) {
      const { message, fieldErrors } = parseApiError(err)
      setError(fieldErrors.name || message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open title={editing ? 'Rename Category' : 'Add Contractor Category'} onClose={onClose}>
      <div className="flex flex-col gap-[12px]">
        <div>
          <FieldLabel htmlFor="cat-name" required className="pb-[6px]">Name</FieldLabel>
          <input id="cat-name" value={name} onChange={(e) => { setName(e.target.value); setError('') }}
            onKeyDown={(e) => e.key === 'Enter' && save()} placeholder="e.g. Concrete" className={inputClass(error)} />
          <FieldError>{error}</FieldError>
        </div>
        <div className="flex justify-end gap-[10px] pt-[6px]">
          <button type="button" onClick={onClose} className={secondaryButton}>Cancel</button>
          <button type="button" onClick={save} disabled={saving} className={primaryButton}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </Modal>
  )
}

function TemplateList({ category, onChanged }) {
  const notify = useToast()
  const [busy, setBusy] = useState(null)
  const input = useRef(null)
  const base = `/contractor-categories/${category.id}/templates`

  const upload = async (files) => {
    const problems = files.map((f) => checkFile(f)).filter(Boolean)
    if (problems.length) { notify(problems.join(' '), 'error'); return }
    const data = new FormData()
    files.forEach((f) => data.append('files[]', f))
    setBusy('upload')
    try {
      await api.post(base, data)
      notify(files.length === 1 ? 'Document added.' : `${files.length} documents added.`)
      onChanged()
    } catch (err) {
      notify(parseApiError(err).message, 'error')
    } finally {
      setBusy(null)
    }
  }

  const remove = async (t) => {
    setBusy(t.id)
    try { await api.delete(`${base}/${t.id}`); notify('Document removed.'); onChanged() }
    catch (err) { notify(parseApiError(err).message, 'error') }
    finally { setBusy(null) }
  }

  const download = (t) => downloadFile(`${base}/${t.id}/download`, t.name)
    .catch((err) => notify(parseApiError(err, 'Download failed.').message, 'error'))

  return (
    <div className="flex flex-col items-start gap-[6px]">
      {category.templates.length === 0 && <span className="text-[10px] text-muted">No scope documents yet.</span>}
      {category.templates.map((t) => (
        <span key={t.id} className="flex items-center gap-[8px]">
          <FileTag name={t.name} small />
          <button type="button" onClick={() => download(t)} className="text-[11px] text-ink hover:underline" title="Download">{t.name}</button>
          <span className="text-[9px] text-muted">{formatSize(t.size)}</span>
          <button type="button" onClick={() => remove(t)} disabled={busy === t.id} aria-label={`Remove ${t.name}`}
            className="text-[11px] text-ink-sub hover:text-brand disabled:opacity-50">✕</button>
        </span>
      ))}
      <button type="button" onClick={() => input.current?.click()} disabled={busy === 'upload'} className={linkButton}>
        {busy === 'upload' ? 'Uploading…' : '+ Add document'}
      </button>
      <input ref={input} type="file" hidden multiple accept={ACCEPT}
        onChange={(e) => { upload(Array.from(e.target.files || [])); e.target.value = '' }} />
    </div>
  )
}

export default function CategoriesPage() {
  const notify = useToast()
  const [categories, setCategories] = useState(null)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(null) // null | 'new' | category
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(() => api.get('/contractor-categories')
    .then(({ data }) => { setCategories(data.data); setError('') })
    .catch((err) => setError(parseApiError(err, 'Could not load categories.').message)), [])
  useEffect(() => { load() }, [load])

  const saved = (message) => { notify(message); setModal(null); load() }

  const confirmDelete = async () => {
    setDeleting(true)
    try {
      const { data } = await api.delete(`/contractor-categories/${toDelete.id}`)
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
      <PageHeader title="Contractor Categories" subtitle="Trades you request quotes for. Scope documents are attached automatically when a category is chosen.">
        <button type="button" onClick={() => setModal('new')} className={primaryButton}>+ Add Category</button>
      </PageHeader>

      <Table ariaLabel="Contractor categories" loading={categories === null && !error} error={error} onRetry={load}
        empty="No categories yet." columns={[['CATEGORY', 180], ['CONTRACTORS', 110], ['SCOPE OF WORK DOCUMENTS'], ['ACTION', 130]]}>
        {categories?.map((c) => (
          <tr key={c.id}>
            <td className={`${td} font-semibold text-ink`}>{c.name}</td>
            <td className={td}>{plural(c.contractors_count, 'contractor')}</td>
            <td className={td}><TemplateList category={c} onChanged={load} /></td>
            <td className={`${td} text-right`}>
              <button type="button" onClick={() => setModal(c)} className={linkButton}>Rename</button>
              <button type="button" onClick={() => setToDelete(c)} className={`${linkButton} ml-[12px] text-brand-bright`}>Delete</button>
            </td>
          </tr>
        ))}
      </Table>

      {modal && <CategoryModal category={modal === 'new' ? null : modal} onClose={() => setModal(null)} onSaved={saved} />}
      <ConfirmDialog open={!!toDelete} title={`Delete ${toDelete?.name}?`} busy={deleting}
        message="The category and its scope documents will be deleted. Categories with contractors or quotations can’t be deleted."
        onConfirm={confirmDelete} onCancel={() => setToDelete(null)} />
    </section>
  )
}
