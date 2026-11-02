import { useCallback, useEffect, useState } from 'react'
import api, { parseApiError } from '../../../api/client'
import deleteMask from '../../../assets/figma/delete-mask.png'
import editIcon from '../../../assets/figma/edit.png'
import fileIcon from '../../../assets/figma/file.svg'
import imageIcon from '../../../assets/figma/image.svg'
import plusIcon from '../../../assets/figma/plus.svg'
import Dropzone from '../../../components/ui/Dropzone'
import { apiUrl, formatDate, formatTime } from '../../../lib/format'

const ACCEPT = '.pdf,.xls,.xlsx,.csv,.doc,.docx,.jpg,.jpeg,.png'

export default function NotesTab({ quotation: q, onChanged }) {
  const [notes, setNotes] = useState(null)
  const [body, setBody] = useState('')
  const [files, setFiles] = useState([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    api.get(`/quotations/${q.id}/notes`).then(({ data }) => setNotes(data.data)).catch((e) => setError(parseApiError(e).message))
  }, [q.id])
  useEffect(load, [load])

  const add = async () => {
    setSaving(true); setError('')
    const form = new FormData()
    form.append('body', body)
    files.forEach((f) => form.append('files[]', f))
    try {
      await api.post(`/quotations/${q.id}/notes`, form)
      setBody(''); setFiles([]); load(); onChanged()
    } catch (e) {
      const { message, fieldErrors } = parseApiError(e)
      setError(Object.values(fieldErrors)[0] || message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="px-[24px] pb-[32px] pt-[30px]">
      <div className="flex flex-col items-end gap-[16px]">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a note"
          aria-label="Write a note"
          className="h-[128px] w-full resize-none rounded-[4px] border border-[#cecece] p-[17px] text-[14px] leading-[20px] text-[#191c1e] outline-none placeholder:italic placeholder:text-[rgba(107,114,128,0.4)] focus:border-brand"
        />
        <div className="w-full">
          <Dropzone size="sm" accept={ACCEPT} onFiles={(f) => setFiles((list) => [...list, ...f])} label="Attach files to the note" />
          {files.length > 0 && (
            <div className="mt-[8px] flex flex-wrap gap-[8px]">
              {files.map((f, i) => (
                <span key={i} className="flex items-center gap-[6px] rounded-[6px] border border-[#edeef0] bg-[rgba(231,231,231,0.5)] px-[10px] py-[4px] text-[11px] text-[#191c1e]">
                  {f.name}
                  <button type="button" aria-label={`Remove ${f.name}`} onClick={() => setFiles((l) => l.filter((_, j) => j !== i))} className="text-ink-sub hover:text-brand">✕</button>
                </span>
              ))}
            </div>
          )}
        </div>
        {error && <p role="alert" className="w-full text-[11px] text-brand-bright">{error}</p>}
        <button type="button" onClick={add} disabled={saving}
          className="flex h-[33px] items-center justify-center gap-[8px] rounded-[4px] border border-brand-dark bg-brand-bright px-[25px] text-[13px] font-semibold text-white hover:bg-brand-dark disabled:opacity-60">
          <img src={plusIcon} alt="" width="8.16667" height="8.16667" /> {saving ? 'Adding…' : 'Add Note'}
        </button>
      </div>

      <div className="flex flex-col gap-[12px] pt-[16px]">
        {notes?.length === 0 && <p className="py-[20px] text-center text-[12px] text-muted-grey">No notes yet.</p>}
        {notes?.map((note) => <NoteCard key={note.id} note={note} quotationId={q.id} onChanged={() => { load(); onChanged() }} />)}
      </div>
    </div>
  )
}

function NoteCard({ note, quotationId, onChanged }) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(note.body)
  const [error, setError] = useState('')
  const url = `/quotations/${quotationId}/notes/${note.id}`

  const save = () => api.put(url, { body: text }).then(() => { setEditing(false); onChanged() }).catch((e) => setError(parseApiError(e).message))
  const remove = () => window.confirm('Delete this note?') && api.delete(url).then(onChanged).catch((e) => setError(parseApiError(e).message))

  return (
    <article className="flex flex-col gap-[8px] rounded-[10px] border-[0.8px] border-[#cecece] bg-white p-[16.8px]">
      <header className="flex items-center justify-between border-b border-[#cecece] pb-[10px]">
        <div className="flex items-center gap-[5px]">
          <span className="flex size-[21px] items-center justify-center rounded-full bg-[rgba(255,0,22,0.22)] text-[8px] font-medium text-brand-bright">{note.author.charAt(0).toUpperCase()}</span>
          <div className="flex flex-col">
            <span className="text-[14px] leading-[20px] text-[#191c1e]">{note.author}</span>
            <span className="text-[11px] leading-[16.5px] text-[#404754]">{formatDate(note.created_at)} • {formatTime(note.created_at)}</span>
          </div>
        </div>
        <div className="flex items-center gap-[4px]">
          <button type="button" aria-label="Edit note" onClick={() => { setText(note.body); setEditing(true) }}>
            <img src={editIcon} alt="" className="h-[21.731px] w-[25.564px] object-cover" />
          </button>
          <button type="button" aria-label="Delete note" onClick={remove}
            className="size-[13.021px] bg-[#ff3661]" style={{ maskImage: `url("${deleteMask}")`, WebkitMaskImage: `url("${deleteMask}")`, maskSize: '13.021px 13.021px', WebkitMaskSize: '13.021px 13.021px' }} />
        </div>
      </header>
      {editing ? (
        <div className="flex flex-col items-end gap-[8px]">
          <textarea value={text} onChange={(e) => setText(e.target.value)} aria-label="Edit note"
            className="h-[80px] w-full resize-none rounded-[4px] border border-[#cecece] p-[10px] text-[12px] outline-none focus:border-brand" />
          <div className="flex gap-[8px]">
            <button type="button" onClick={() => setEditing(false)} className="rounded-[3px] border border-[#d8dde1] px-[12px] py-[5px] text-[11px] text-[#525e67]">Cancel</button>
            <button type="button" onClick={save} className="rounded-[3px] bg-brand px-[12px] py-[5px] text-[11px] font-bold text-white">Save</button>
          </div>
        </div>
      ) : (
        <p className="whitespace-pre-line text-[12px] italic leading-[20px] text-[#191c1e]">{note.body}</p>
      )}
      {error && <p role="alert" className="text-[11px] text-brand-bright">{error}</p>}
      {note.attachments.length > 0 && (
        <div className="flex flex-wrap gap-[10px] pt-[4px]">
          {note.attachments.map((a) => (
            <a key={a.id} href={apiUrl(`/quotations/${quotationId}/note-attachments/${a.id}`)}
              className="flex items-center gap-[8px] rounded-[6px] border border-[#edeef0] bg-[rgba(231,231,231,0.5)] px-[13px] py-[5px] text-[11px] leading-[16.5px] text-[#191c1e] hover:border-line-field">
              {/\.(jpe?g|png)$/i.test(a.name)
                ? <img src={imageIcon} alt="" width="10.5" height="10.5" />
                : <img src={fileIcon} alt="" width="9.33333" height="11.6667" />}
              {a.name}
            </a>
          ))}
        </div>
      )}
    </article>
  )
}
