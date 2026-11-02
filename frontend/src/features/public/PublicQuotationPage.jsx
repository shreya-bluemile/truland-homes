import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api, { parseApiError } from '../../api/client'
import Logo from '../../components/layout/Logo'
import FileDropzone from '../../components/ui/FileDropzone'
import { CheckIcon, ClipboardCheck, FileIcon } from '../../components/ui/Icons'
import { checkFile, QUOTE_EXTENSIONS } from '../../utils/files'
import { formatDate, formatDateTime, formatSize } from '../../utils/format'

const ACCEPT = QUOTE_EXTENSIONS.map((e) => `.${e}`).join(',')

function Card({ children, className = '' }) {
  return (
    <div className="flex min-h-full items-center justify-center bg-gradient-to-b from-[#777] to-[#3b3b3b] px-4 py-10">
      <div className={`w-full max-w-[562px] rounded-[14px] bg-white px-[30px] py-[34px] shadow-[0_10px_30px_rgba(0,0,0,0.25)] ${className}`}>
        <div className="flex justify-center"><Logo variant="dark" size="lg" /></div>
        {children}
      </div>
    </div>
  )
}

function Summary({ rows, tone = 'cool' }) {
  return (
    <dl className={`mt-[14px] rounded-[10px] px-[20px] py-[14px] ${tone === 'warm' ? 'bg-[#f6f5f2]' : 'bg-[#f6f8fa]'}`}>
      {rows.map(([label, value], i) => (
        <div key={label} className={`flex items-start justify-between gap-6 py-[7px] text-[13px] ${tone === 'warm' && i > 0 ? 'border-t border-[#e6e3dc]' : ''}`}>
          <dt className="text-[#7b8794]">{label}</dt>
          <dd className={`text-right text-[#1f2937] ${tone === 'warm' ? 'font-semibold' : 'font-medium'}`}>{value}</dd>
        </div>
      ))}
    </dl>
  )
}

export default function PublicQuotationPage() {
  const { token } = useParams()
  const [info, setInfo] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [file, setFile] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(null)

  useEffect(() => {
    api.get(`/public/quotations/${token}`)
      .then(({ data }) => setInfo(data.data))
      .catch((err) => setLoadError(parseApiError(err, 'This link could not be opened.').message))
  }, [token])

  const pick = ([f]) => {
    const problem = checkFile(f, QUOTE_EXTENSIONS)
    setError(problem || '')
    if (!problem) setFile(f)
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!file) { setError('Choose your quotation file to upload.'); return }
    const body = new FormData()
    body.append('file', file)
    if (message.trim()) body.append('message', message.trim())
    setSubmitting(true)
    try {
      const { data } = await api.post(`/public/quotations/${token}/submit`, body)
      setDone(data.data)
    } catch (err) {
      const { message: msg, fieldErrors } = parseApiError(err)
      setError(fieldErrors.file || fieldErrors.message || msg)
    } finally {
      setSubmitting(false)
    }
  }

  if (loadError) {
    return (
      <Card>
        <h1 className="mt-[28px] text-center text-[18px] font-semibold text-[#1f2937]">This link can’t be used</h1>
        <p className="mt-[8px] text-center text-[13px] leading-[20px] text-[#7b8794]">{loadError}</p>
      </Card>
    )
  }
  if (!info) return <Card><p className="mt-[28px] text-center text-[13px] text-[#7b8794]">Loading…</p></Card>

  if (done) {
    return (
      <Card>
        <div className="mx-auto mt-[30px] flex size-[74px] items-center justify-center rounded-full bg-[#e6f4ea] text-[#1f6f4a]">
          <CheckIcon className="size-[26px]" />
        </div>
        <h1 className="mt-[22px] text-center text-[24px] font-semibold text-[#1f1f1f]">Thank you</h1>
        <p className="mx-auto mt-[12px] max-w-[440px] text-center text-[12.5px] leading-[20px] text-[#7b8794]">
          We’ve received your quotation for <strong className="font-semibold text-[#1f2937]">{done.quote_no}</strong>. Our estimating team will be in touch if we need anything else.
        </p>
        <Summary tone="warm" rows={[['Lot address', done.lot_address], ['Submitted', formatDateTime(done.submitted_at, { comma: true, lower: true })]]} />
        <p className="mx-auto mt-[18px] max-w-[460px] text-center text-[12.5px] leading-[20px] text-[#7b8794]">
          Our team will review your response and confirm the date shortly. You can now close this window.
        </p>
        <div className="mt-[30px] flex justify-center">
          <button type="button" onClick={() => window.close()} className="h-[48px] w-[162px] rounded-[8px] bg-brand-bright text-[15px] font-semibold text-white hover:bg-[#e00014]">Close</button>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <form onSubmit={submit} noValidate>
        <p className="mt-[22px] flex items-center justify-center gap-[8px] text-[11px] font-semibold tracking-[1px] text-[#8a94a6]">
          <ClipboardCheck /> UPLOAD QUOTATION
        </p>
        <h1 className="mt-[30px] text-[17px] font-medium text-black">Dear {info.contractor_name || 'Contractor'},</h1>
        <p className="mt-[4px] text-[12px] leading-[19px] text-[#7b8794]">
          Truland Homes has requested a quote for <strong className="font-semibold text-[#1f2937]">{info.category} ({info.quote_no})</strong>. Please review the details and upload your quotation.
        </p>
        <Summary rows={[['Lot Address', info.lot_address], ['Due Date', info.due_date ? formatDate(info.due_date) : '—']]} />

        {info.submitted_at && (
          <p className="mt-[14px] rounded-[6px] bg-[#e8f2ff] px-[12px] py-[9px] text-[12px] text-[#295cbd]">
            You sent “{info.submitted_file}” on {formatDateTime(info.submitted_at, { comma: true, lower: true })}. Uploading again sends a newer version.
          </p>
        )}

        <label className="mt-[24px] block text-[13px] text-black">Upload Quotation<span className="text-brand-bright">*</span></label>
        <div className="mt-[8px]">
          {file ? (
            <div className="flex h-[74px] items-center gap-[10px] border border-[#e5e7eb] px-[16px]">
              <FileIcon className="h-[16px] w-[13px]" />
              <span className="flex-1 truncate text-[13px] text-[#1f2937]">{file.name}</span>
              <span className="text-[12px] text-[#7b8794]">{formatSize(file.size)}</span>
              <button type="button" onClick={() => setFile(null)} className="text-[12px] font-semibold text-brand hover:underline">Change</button>
            </div>
          ) : (
            <FileDropzone multiple={false} accept={ACCEPT} onFiles={pick} className="!h-[74px] !border !border-[#e5e7eb]" />
          )}
        </div>

        <label htmlFor="message" className="mt-[22px] block text-[13px] text-black">Anything else</label>
        <textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={2000}
          className="mt-[8px] h-[84px] w-full resize-none rounded-[4px] border border-[#cfd4da] p-[10px] text-[13px] outline-none focus:border-brand" />

        {error && <p role="alert" className="mt-[10px] text-[12px] text-brand-bright">{error}</p>}
        <div className="mt-[30px] flex justify-center">
          <button type="submit" disabled={submitting} className="h-[48px] w-[162px] rounded-[8px] bg-brand-bright text-[15px] font-semibold text-white hover:bg-[#e00014] disabled:opacity-60">
            {submitting ? 'Uploading…' : 'Submit'}
          </button>
        </div>
      </form>
    </Card>
  )
}
