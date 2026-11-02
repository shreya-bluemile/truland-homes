import { useCallback, useEffect, useState } from 'react'
import api, { parseApiError } from '../../api/client'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import FileDropzone from '../../components/ui/FileDropzone'
import { FileIcon, ImageIcon, PencilBox, PlusIcon, TrashIcon } from '../../components/ui/Icons'
import { useToast } from '../../components/ui/useToast'
import { checkFile, DOCUMENT_EXTENSIONS, downloadFile, extensionOf } from '../../utils/files'
import { formatNoteDate, initial } from '../../utils/format'

const ACCEPT = DOCUMENT_EXTENSIONS.map((e) => `.${e}`).join(',')
const isImage = (name) => ['jpg', 'jpeg', 'png'].includes(extensionOf(name))

function Chip({ name, onClick, onRemove }) {
  return (
    <span className="flex items-center gap-[8px] rounded-[6px] border border-[#edeef0] bg-[rgba(231,231,231,0.5)] px-[13px] py-[5px]">
      {isImage(name) ? <ImageIcon /> : <FileIcon />}
      {onClick
        ? <button type="button" onClick={onClick} className="text-[11px] leading-[16.5px] text-[#191c1e] hover:underline">{name}</button>
        : <span className="text-[11px] leading-[16.5px] text-[#191c1e]">{name}</span>}
      {onRemove && <button type="button" onClick={onRemove} aria-label={`Remove ${name}`} className="text-[11px] text-ink-sub hover:text-brand">✕</button>}
    </span>
  )
}

function useFilePicker() {
  const [files, setFiles] = useState([])
  const [error, setError] = useState('')
  const add = (list) => {
    const problems = list.map((f) => checkFile(f)).filter(Boolean)
    setFiles((f) => [...f, ...list.filter((x) => !checkFile(x))])
    setError(problems.join(' '))
  }
  const remove = (i) => setFiles((f) => f.filter((_, j) => j !== i))
  const reset = () => { setFiles([]); setError('') }
  return { files, error, add, remove, reset, setError }
}

function NoteCard({ note, base, onSaved, onDelete }) {
  const notify = useToast()
  const [editing, setEditing] = useState(false)
  const [body, setBody] = useState(note.body)
  const [removeIds, setRemoveIds] = useState([])
  const picker = useFilePicker()
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!body.trim()) { picker.setError('Write a note before saving.'); return }
    const data = new FormData()
    data.append('_method', 'PUT')
    data.append('body', body.trim())
    removeIds.forEach((id) => data.append('remove_attachment_ids[]', id))
    picker.files.forEach((f) => data.append('files[]', f))
    setSaving(true)
    try {
      await api.post(`${base}/${note.id}`, data)
      setEditing(false); setRemoveIds([]); picker.reset()
      onSaved('Note updated.')
    } catch (err) {
      picker.setError(parseApiError(err).message)
    } finally {
      setSaving(false)
    }
  }

  const download = (a) => downloadFile(`${base}/${note.id}/attachments/${a.id}/download`, a.name)
    .catch((err) => notify(parseApiError(err, 'Download failed.').message, 'error'))

  const attachments = note.attachments.filter((a) => !removeIds.includes(a.id))

  return (
    <article className="flex flex-col gap-[8px] rounded-[10px] border-[0.8px] border-[#cecece] bg-white p-[16.8px]">
      <header className="flex items-center justify-between border-b border-[#cecece] pb-[10px]">
        <div className="flex items-center gap-[5px]">
          <span className="flex size-[21px] items-center justify-center rounded-full bg-[rgba(255,0,22,0.22)] text-[8px] font-medium text-brand-bright">{initial(note.author.name)}</span>
          <div className="flex flex-col gap-[3px]">
            <span className="text-[14px] leading-[16px] text-[#191c1e]">{note.author.name}</span>
            <span className="text-[11px] leading-[16.5px] text-[#404754]">{formatNoteDate(note.created_at)}</span>
          </div>
        </div>
        {note.can_edit && !editing && (
          <div className="flex items-center gap-[4px]">
            <button type="button" onClick={() => setEditing(true)} aria-label="Edit note"><PencilBox /></button>
            <button type="button" onClick={() => onDelete(note)} aria-label="Delete note" className="p-[2px]"><TrashIcon /></button>
          </div>
        )}
      </header>

      {editing ? (
        <div className="flex flex-col gap-[8px]">
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} maxLength={5000} aria-label="Edit note"
            className="w-full rounded-[4px] border border-[#cecece] p-[10px] text-[12px] italic text-[#191c1e] outline-none focus:border-brand" />
          <div className="flex flex-wrap gap-[8px]">
            {attachments.map((a) => <Chip key={a.id} name={a.name} onRemove={() => setRemoveIds((ids) => [...ids, a.id])} />)}
            {picker.files.map((f, i) => <Chip key={`n${i}`} name={f.name} onRemove={() => picker.remove(i)} />)}
          </div>
          <FileDropzone compact onFiles={picker.add} accept={ACCEPT} />
          {picker.error && <p role="alert" className="text-[11px] text-brand-bright">{picker.error}</p>}
          <div className="flex justify-end gap-[8px]">
            <button type="button" onClick={() => { setEditing(false); setBody(note.body); setRemoveIds([]); picker.reset() }}
              className="min-h-[28px] rounded-[3px] border-[0.909px] border-[#d8dde1] px-[12px] text-[11px] text-[#525e67]">Cancel</button>
            <button type="button" onClick={save} disabled={saving}
              className="min-h-[28px] rounded-[3px] bg-brand-bright px-[12px] text-[11px] font-semibold text-white disabled:opacity-60">{saving ? 'Saving…' : 'Save note'}</button>
          </div>
        </div>
      ) : (
        <>
          <p className="whitespace-pre-line text-[12px] italic leading-[20px] text-[#191c1e]">{note.body}</p>
          {note.attachments.length > 0 && (
            <div className="flex flex-wrap gap-[10px] pt-[4px]">
              {note.attachments.map((a) => <Chip key={a.id} name={a.name} onClick={() => download(a)} />)}
            </div>
          )}
        </>
      )}
    </article>
  )
}

export default function NotesTab({ quotationId, onChanged }) {
  const notify = useToast()
  const base = `/quotations/${quotationId}/notes`
  const [notes, setNotes] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [body, setBody] = useState('')
  const picker = useFilePicker()
  const [adding, setAdding] = useState(false)
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(() => api.get(base)
    .then(({ data }) => { setNotes(data.data); setLoadError('') })
    .catch((err) => setLoadError(parseApiError(err, 'Could not load notes.').message)), [base])
  useEffect(() => { load() }, [load])

  const refreshed = (message) => { notify(message); load(); onChanged() }

  const add = async () => {
    if (!body.trim()) { picker.setError('Write a note before adding it.'); return }
    const data = new FormData()
    data.append('body', body.trim())
    picker.files.forEach((f) => data.append('files[]', f))
    setAdding(true)
    try {
      await api.post(base, data)
      setBody(''); picker.reset()
      refreshed('Note added.')
    } catch (err) {
      const { message, fieldErrors } = parseApiError(err)
      picker.setError(Object.values(fieldErrors)[0] || message)
    } finally {
      setAdding(false)
    }
  }

  const confirmDelete = async () => {
    setDeleting(true)
    try { await api.delete(`${base}/${toDelete.id}`); setToDelete(null); refreshed('Note deleted.') }
    catch (err) { notify(parseApiError(err).message, 'error'); setToDelete(null) }
    finally { setDeleting(false) }
  }

  return (
    <div className="px-[24px] pb-[32px] pt-[30px]">
      <div className="flex flex-col items-end gap-[16px]">
        <textarea value={body} onChange={(e) => { setBody(e.target.value); picker.setError('') }} placeholder="Write a note" aria-label="Write a note" maxLength={5000}
          className="h-[128px] w-full resize-none rounded-[4px] border border-[#cecece] p-[17px] text-[14px] leading-[20px] text-[#191c1e] outline-none placeholder:italic placeholder:text-[rgba(107,114,128,0.4)] focus:border-brand" />
        <FileDropzone compact onFiles={picker.add} accept={ACCEPT} />
        {(picker.files.length > 0 || picker.error) && (
          <div className="flex w-full flex-col gap-[6px]">
            <div className="flex flex-wrap gap-[8px]">{picker.files.map((f, i) => <Chip key={i} name={f.name} onRemove={() => picker.remove(i)} />)}</div>
            {picker.error && <p role="alert" className="text-[11px] text-brand-bright">{picker.error}</p>}
          </div>
        )}
        <button type="button" onClick={add} disabled={adding}
          className="flex h-[33px] min-w-[94px] items-center justify-center gap-[8px] rounded-[4px] border border-brand-dark bg-brand-bright px-[14px] text-[13px] font-semibold text-white hover:bg-[#e00014] disabled:opacity-60">
          <PlusIcon className="size-[8px]" /> {adding ? 'Adding…' : 'Add Note'}
        </button>
      </div>

      <div className="flex flex-col gap-[12px] pt-[16px]">
        {loadError && <p role="alert" className="text-[11px] text-brand-bright">{loadError}</p>}
        {notes === null && !loadError && <p className="text-[12px] text-muted">Loading notes…</p>}
        {notes?.length === 0 && <p className="text-[12px] text-muted">No notes yet.</p>}
        {notes?.map((note) => <NoteCard key={note.id} note={note} base={base} onSaved={refreshed} onDelete={setToDelete} />)}
      </div>

      <ConfirmDialog open={!!toDelete} title="Delete this note?" busy={deleting}
        message="The note and its attachments will be deleted. This can’t be undone." onConfirm={confirmDelete} onCancel={() => setToDelete(null)} />
    </div>
  )
}
