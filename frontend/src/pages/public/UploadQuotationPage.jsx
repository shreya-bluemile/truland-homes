import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api, { parseApiError } from '../../api/client'
import checklistIcon from '../../assets/figma/checklist.svg'
import logo from '../../assets/figma/logo.png'
import successCheck from '../../assets/figma/success-check.svg'
import { FileTypeBadge } from '../../components/ui/Badges'
import Dropzone from '../../components/ui/Dropzone'
import { formatDate, formatSize, formatTime } from '../../lib/format'

/** Public page contractors reach from the emailed link. No login: the token in the URL identifies them. */
export default function UploadQuotationPage() {
  const { token } = useParams()
  const [quote, setQuote] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [file, setFile] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    api.get(`/public/quotes/${token}`).then(({ data }) => setQuote(data.data)).catch((e) => setLoadError(parseApiError(e, 'This link is no longer valid.').message))
  }, [token])

  const submit = async (e) => {
    e.preventDefault()
    if (!file) return setError('Please upload your quotation.')
    setSending(true); setError('')
    const form = new FormData()
    form.append('file', file)
    form.append('message', message)
    try {
      const { data } = await api.post(`/public/quotes/${token}`, form)
      setQuote(data.data)
    } catch (err) {
      const { message: msg, fieldErrors } = parseApiError(err)
      setError(fieldErrors.file || msg)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="relative flex min-h-full items-center justify-center bg-gradient-to-b from-[#c4c4c4] via-[#919191] via-[41%] to-[#5e5e5e] px-[24px] py-[80px]">
      <div className="absolute inset-0 bg-[rgba(0,0,0,0.4)] backdrop-blur-[2px]" />
      <main className="relative w-[600px] max-w-full overflow-hidden rounded-[16px] bg-white shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]">
        <div className="flex flex-col items-center gap-[20px] px-[32px] pb-[16px] pt-[32px]">
          <img src={logo} alt="Truland Homes" className="h-[67px] w-[200px] object-cover" />
          {!quote && <p className="pb-[16px] text-[14px] text-[#6b7280]">{loadError || 'Loading…'}</p>}
          {quote && !quote.submitted && <UploadHeader quote={quote} />}
          {quote?.submitted && <ThankYou quote={quote} />}
        </div>

        {quote && !quote.submitted && (
          <form onSubmit={submit} className="flex flex-col gap-[23px] px-[32px] pb-[32px]">
            <div className="flex flex-col gap-[12px] rounded-[12px] border border-[#f3f4f6] bg-[#f9fafb] p-[21px] text-[14px] leading-[20px]">
              <div className="flex justify-between gap-[16px]"><span className="text-[#6b7280]">Lot Address</span><span className="text-right font-medium text-[#111827]">{quote.lot_address}</span></div>
              <div className="flex justify-between gap-[16px]"><span className="text-[#6b7280]">Due Date</span><span className="font-medium text-[#111827]">{formatDate(quote.due_date)}</span></div>
            </div>
            <div className="flex flex-col gap-[10px]">
              <p className="text-[14px] leading-[20px] text-black">Upload Quotation<span className="text-brand-bright">*</span></p>
              {file ? (
                <div className="flex items-center gap-[10px] border-[0.3px] border-line-field px-[12px] py-[10px]">
                  <FileTypeBadge name={file.name} />
                  <span className="flex-1 truncate text-[12px] text-ink">{file.name}</span>
                  <span className="text-[11px] text-ink-sub">{formatSize(file.size)}</span>
                  <button type="button" aria-label="Remove file" onClick={() => setFile(null)} className="text-[12px] text-ink-sub hover:text-brand">✕</button>
                </div>
              ) : (
                <Dropzone multiple={false} accept=".pdf,.xls,.xlsx,.csv,.doc,.docx" onFiles={([f]) => { setFile(f); setError('') }} label="Upload quotation" />
              )}
            </div>
            <div className="flex flex-col gap-[8px] pb-[6px]">
              <label htmlFor="anything-else" className="text-[15px] leading-[22.5px] text-black">Anything else</label>
              <textarea id="anything-else" value={message} onChange={(e) => setMessage(e.target.value)}
                className="h-[90px] resize-none rounded-[5px] border border-[#d1d5db] px-[13px] py-[9px] text-[14px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] outline-none focus:border-brand" />
            </div>
            {error && <p role="alert" className="-mt-[10px] text-[13px] text-brand-bright">{error}</p>}
            <div className="flex justify-center pt-[17px]">
              <button type="submit" disabled={sending} className="w-[173px] rounded-[12px] bg-brand-bright px-[24px] py-[14px] text-[16px] font-semibold leading-[24px] text-white hover:bg-brand-dark disabled:opacity-60">
                {sending ? 'Uploading…' : 'Submit'}
              </button>
            </div>
          </form>
        )}

        {quote?.submitted && (
          <div className="flex justify-center px-[32px] pb-[32px] pt-[17px]">
            <button type="button" onClick={() => window.close()} className="w-[173px] rounded-[12px] bg-brand-bright px-[24px] py-[14px] text-[16px] font-semibold leading-[24px] text-white hover:bg-brand-dark">
              Close
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

function UploadHeader({ quote }) {
  return (
    <div className="flex w-full flex-col gap-[36px]">
      <div className="flex items-center justify-center gap-[8px]">
        <img src={checklistIcon} alt="" width="20" height="20" />
        <p className="text-[12px] font-bold uppercase leading-[18px] tracking-[1.2px] text-[#9ca3af]">Upload quotation</p>
      </div>
      <div>
        <h1 className="text-[18px] font-medium leading-[32px] text-black">Dear Contractor,</h1>
        <p className="text-[13px] leading-[19.5px] text-[#7b8794]">
          Truland Homes has requested a quote for <span className="font-semibold text-[#1f2933]">{quote.category} ({quote.reference})</span>. Please review the details and upload your quotation.
        </p>
      </div>
    </div>
  )
}

function ThankYou({ quote }) {
  return (
    <>
      <div className="flex justify-center pt-[9px]">
        <span className="flex size-[80px] items-center justify-center rounded-full bg-[#e8f5e9]">
          <img src={successCheck} alt="" width="32" height="32" />
        </span>
      </div>
      <div className="flex flex-col items-center gap-[15px]">
        <h1 className="text-[24px] font-semibold leading-[32px] text-[#1a1a1a]">Thank you</h1>
        <p className="w-[461px] max-w-full text-center text-[13px] leading-[19.5px] text-[#7b8794]">
          We’ve received your quotation for <span className="font-semibold text-[#1f2933]">{quote.reference}</span>. Our estimating team will be in touch if we need anything else.
        </p>
      </div>
      <div className="flex w-full flex-col gap-[20px] rounded-[16px] bg-[#f8f7f3] p-[24px] text-[14px]">
        <div className="flex justify-between gap-[16px] border-b border-[#e5e7eb] pb-[6px]">
          <span className="font-medium leading-[20px] text-[#848f9e]">Lot address</span>
          <span className="max-w-[245px] text-right font-semibold leading-[19.25px] text-[#1a1a1a]">{quote.lot_address}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-medium leading-[20px] text-[#848f9e]">Submitted</span>
          <span className="text-[13px] font-semibold leading-[19.5px] text-[#1f2933]">{formatDate(quote.submitted_at)}, {formatTime(quote.submitted_at, { lower: true, padHour: false })}</span>
        </div>
      </div>
      <p className="text-center text-[13px] leading-[21.13px] text-[#848f9e]">Our team will review your quotation shortly. You can now close this window.</p>
    </>
  )
}
