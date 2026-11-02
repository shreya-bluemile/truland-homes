import downloadIcon from '../../../assets/figma/download.svg'
import { FileTypeBadge } from '../../../components/ui/Badges'
import { apiUrl, formatDate, formatSize, formatTime } from '../../../lib/format'

const SectionTitle = ({ children, className = '' }) => (
  <h2 className={`text-[10px] font-bold uppercase tracking-[0.5px] text-muted ${className}`}>{children}</h2>
)

export default function DetailsTab({ quotation: q }) {
  const total = q.documents.reduce((sum, d) => sum + d.size, 0)
  const due = formatDate(q.due_date)
  const rows = [
    ['Quotation No.', q.number],
    ['Lot Address', q.lot_address],
    ['Contractor Category', q.category],
    ['Created Details', `by ${q.created_by} , ${formatDate(q.created_at)} ${formatTime(q.created_at)}`],
    ['Due Date', due || '—'],
  ]
  const p = 'text-[11px] leading-[17.6px] text-ink-body'

  return (
    <div className="p-[22px]">
      <SectionTitle>Quotation details</SectionTitle>
      <dl className="mt-[10px] rounded-[4px] border-[0.909px] border-line bg-white">
        {rows.map(([label, value]) => (
          <div key={label} className="flex border-b-[0.909px] border-line-soft px-[16px] py-[12px] text-[12px] last:border-b-0">
            <dt className="w-[140px] shrink-0 text-muted">{label}</dt>
            <dd className="text-ink">{value}</dd>
          </div>
        ))}
      </dl>

      <SectionTitle className="pt-[24px]">{q.draft ? 'Email content (not sent yet)' : 'Email content sent'}</SectionTitle>
      <div className="mt-[10px] overflow-hidden rounded-[4px] border-[0.909px] border-line bg-white">
        <div className="border-b-[0.909px] border-line bg-surface-subtle px-[14px] py-[10px] text-[11px] leading-[17.6px]">
          <span className="font-bold text-ink-label">Subject:</span> <span className="text-ink-soft">{q.subject}</span>
        </div>
        <div className="flex flex-col gap-[10px] p-[14px]">
          <p className={p}>Hi [Contractor Name],</p>
          <p className={p}>
            We’d like a quote for the {q.category.toLowerCase()} work on the lot below. Please review the scope and attached documents and upload your quotation by <strong>{due}</strong>.
          </p>
          <div className="rounded-[3px] border-[0.909px] border-line bg-surface-subtle p-[10px] text-[11px] leading-[17.6px] text-ink-body">
            <p className="font-bold">Project details</p>
            <p className="pl-[3px]">Lot address: {q.lot_address}</p>
            {q.floor_plan && <p className="pl-[3px]">Floor Plan: {q.floor_plan}</p>}
          </div>
          <p className={p}>Please provide your own pricing and quote breakdown. No pricing has been prefilled in this request.</p>
          <div className="flex justify-center pt-[5px]">
            <span className="rounded-[3px] bg-brand px-[13px] py-[8px] text-[11px] font-bold leading-[17.6px] text-white">Upload your quotation (PDF / Excel)</span>
          </div>
          <p className={p}>Alternatively, you can reply directly to this email with your quotation attached and keep {q.contractor_reference} in the subject line.</p>
          <p className={`${p} pb-[10px]`}>Thank you,<br /><strong>Truland Homes</strong></p>
        </div>

        <div className="flex flex-col gap-[10px] border-t border-line bg-surface-subtle px-[14px] pb-[14px] pt-[12px]">
          <div className="flex items-center gap-[8px]">
            <p className="text-[11px] font-bold text-ink">Attached documents ({q.documents.length})</p>
            <p className="text-[10px] text-muted">{formatSize(total)}</p>
            <span className="flex-1" />
            {q.documents.length > 0 && (
              <a href={apiUrl(`/quotations/${q.id}/documents/download-all`)} className="text-[11px] font-semibold text-brand hover:underline">⤓ Download all</a>
            )}
          </div>
          <div className="grid grid-cols-2 gap-[8px]">
            {q.documents.map((d) => (
              <a key={d.id} href={apiUrl(`/quotations/${q.id}/documents/${d.id}`)}
                className="flex items-center gap-[8px] overflow-hidden rounded-[4px] border border-line bg-white px-[10px] py-[8px] hover:border-line-field">
                <FileTypeBadge name={d.name} size="sm" />
                <span className="flex min-w-0 flex-1 flex-col gap-px">
                  <span className="truncate text-[11px] font-medium text-ink">{d.name}</span>
                  <span className="text-[9px] text-muted">{formatSize(d.size)}</span>
                </span>
                <img src={downloadIcon} alt="Download" width="12" height="12" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
