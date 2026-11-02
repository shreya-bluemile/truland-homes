import { useState } from 'react'
import { parseApiError } from '../../api/client'
import { FileTag } from '../../components/ui/Badges'
import { DownloadIcon } from '../../components/ui/Icons'
import { useToast } from '../../components/ui/useToast'
import { downloadFile } from '../../utils/files'
import { formatDate, formatDateTime, formatSize } from '../../utils/format'

const SectionTitle = ({ children, className = '' }) => (
  <h2 className={`text-[10px] font-bold uppercase tracking-[0.5px] text-muted ${className}`}>{children}</h2>
)

// Styles applied to the sent email inside the preview frame, matching the Figma Details tab.
const EMAIL_PREVIEW_CSS = `
  body { margin: 0; font-family: Inter, Arial, sans-serif; font-size: 11px; line-height: 17.6px; color: #424c54; }
  p { margin: 0 0 10px; } ul { margin: 0 0 10px; padding-left: 18px; }
  a[href] { pointer-events: none; }
`

function EmailPreview({ html }) {
  const [height, setHeight] = useState(200)
  return (
    <iframe
      title="Email content sent"
      sandbox="allow-same-origin"
      srcDoc={`<!doctype html><html><head><meta charset="utf-8"><style>${EMAIL_PREVIEW_CSS}</style></head><body>${html}</body></html>`}
      onLoad={(e) => setHeight(e.currentTarget.contentDocument?.body?.scrollHeight + 4 || 200)}
      style={{ height }}
      className="w-full border-0"
    />
  )
}

export default function DetailsTab({ quotation }) {
  const notify = useToast()
  const [downloading, setDownloading] = useState(null)
  const docs = quotation.documents
  const totalSize = docs.reduce((sum, d) => sum + d.size, 0)

  const download = async (key, url, name) => {
    setDownloading(key)
    try { await downloadFile(url, name) } catch (err) { notify(parseApiError(err, 'Download failed.').message, 'error') } finally { setDownloading(null) }
  }

  const rows = [
    ['Quotation No.', quotation.quote_no],
    ['Lot Address', quotation.lot.address],
    ['Contractor Category', quotation.category?.name || '—'],
    ['Created Details', `by ${quotation.created_by.name} , ${formatDateTime(quotation.created_at)}`],
    ['Due Date', quotation.due_date ? formatDate(quotation.due_date) : '—'],
  ]

  return (
    <div className="p-[22px]">
      <SectionTitle>Quotation details</SectionTitle>
      <dl className="mt-[10px] rounded-[4px] border-[0.909px] border-line bg-white">
        {rows.map(([label, value], i) => (
          <div key={label} className={`flex px-[16px] py-[12px] ${i < rows.length - 1 ? 'border-b-[0.909px] border-line-soft' : ''}`}>
            <dt className="w-[140px] shrink-0 text-[12px] text-muted">{label}</dt>
            <dd className="text-[12px] text-ink">{value}</dd>
          </div>
        ))}
      </dl>

      <SectionTitle className="pt-[24px]">Email content sent</SectionTitle>
      <div className="mt-[10px] overflow-hidden rounded-[4px] border-[0.909px] border-line bg-white">
        {quotation.email ? (
          <>
            <div className="border-b-[0.909px] border-line bg-surface-subtle px-[14px] py-[10px] text-[11px] leading-[17.6px]">
              <span className="font-bold text-ink-label">Subject:</span> <span className="text-ink-soft">{quotation.email.subject}</span>
            </div>
            <div className="p-[14px]"><EmailPreview html={quotation.email.body} /></div>
          </>
        ) : (
          <p className="p-[14px] text-[11px] text-muted">This quotation hasn’t been emailed yet.</p>
        )}

        <div className="flex flex-col gap-[10px] border-t border-line bg-surface-subtle px-[14px] pb-[14px] pt-[12px]">
          <div className="flex items-center gap-[8px]">
            <h3 className="text-[11px] font-bold text-ink">Attached documents ({docs.length})</h3>
            {docs.length > 0 && <span className="text-[10px] text-muted">{formatSize(totalSize)}</span>}
            <span className="flex-1" />
            {docs.length > 0 && (
              <button type="button" disabled={downloading === 'all'}
                onClick={() => download('all', `/quotations/${quotation.id}/documents/download-all`, `${quotation.quote_no}-documents.zip`)}
                className="text-[11px] font-semibold text-brand hover:underline disabled:opacity-60">
                {downloading === 'all' ? 'Preparing…' : '⤓ Download all'}
              </button>
            )}
          </div>
          {docs.length === 0 && <p className="text-[11px] text-muted">No documents were attached.</p>}
          <ul className="flex flex-wrap gap-[8px]">
            {docs.map((d) => (
              <li key={d.id} className="flex w-[299px] items-center gap-[8px] rounded-[4px] border border-line bg-white px-[10px] py-[8px]">
                <FileTag name={d.name} small />
                <div className="flex min-w-0 flex-1 flex-col gap-px">
                  <span className="truncate text-[11px] font-medium text-ink" title={d.name}>{d.name}</span>
                  <span className="text-[9px] text-muted">{formatSize(d.size)}</span>
                </div>
                <button type="button" aria-label={`Download ${d.name}`} disabled={downloading === d.id}
                  onClick={() => download(d.id, `/quotations/${quotation.id}/documents/${d.id}/download`, d.name)}
                  className="text-ink-sub hover:text-brand disabled:opacity-50">
                  <DownloadIcon className="size-3" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
