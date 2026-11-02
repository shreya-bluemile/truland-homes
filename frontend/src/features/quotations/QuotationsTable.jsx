import { StatusBadge } from '../../components/ui/Badges'
import { formatDate, formatDateTime, plural } from '../../utils/format'

const COLUMNS = ['QUOTE NO.', 'LOT ADDRESS', 'CATEGORY', 'CONTRACTORS', 'CREATED DETAILS', 'DUE DATE', 'STATUS']
const cell = 'flex flex-col justify-center p-[11px] text-[11px] text-ink-soft'

function contractorSummary({ contractors, quoted, opened }) {
  if (contractors === 0) return 'No contractors yet'
  return [`${quoted} quoted`, opened > 0 ? `${opened} opened` : null].filter(Boolean).join(' · ')
}

export default function QuotationsTable({ rows, loading, error, onRetry, onOpen }) {
  return (
    <div className="overflow-hidden rounded-[4px] border-[0.909px] border-line bg-white">
      <div role="table" aria-label="Quotations" className="min-w-[790px]">
        <div role="row" className="grid grid-cols-7 bg-surface-head">
          {COLUMNS.map((c) => (
            <div key={c} role="columnheader" className="flex h-[31px] items-center px-[11px] text-[10px] font-bold text-[#46515a]">{c}</div>
          ))}
        </div>

        {loading && rows.length === 0 && <p className="py-[80px] text-center text-[11px] text-muted-grey">Loading quotations…</p>}
        {!loading && error && (
          <p className="py-[80px] text-center text-[11px] text-brand-bright">
            {error} <button type="button" onClick={onRetry} className="font-semibold underline">Try again</button>
          </p>
        )}
        {!loading && !error && rows.length === 0 && (
          <p className="py-[80px] text-center text-[11px] text-muted-grey">No quotations yet.</p>
        )}

        {rows.map((q, i) => (
          <div key={q.id} role="row"
            className={`grid min-h-[50px] grid-cols-7 ${i < rows.length - 1 ? 'border-b-[0.909px] border-line-soft' : ''} ${loading ? 'opacity-60' : ''}`}>
            <div role="cell" className={cell}>
              <button type="button" onClick={() => onOpen(q)} className="w-fit text-left text-[11px] font-semibold text-brand-bright hover:underline">
                {q.quote_no}
              </button>
            </div>
            <div role="cell" className={cell}>{q.lot.address}</div>
            <div role="cell" className={cell}>{q.category?.name || '—'}</div>
            <div role="cell" className={cell}>
              <span>{plural(q.counts.contractors, 'contractor')}</span>
              {q.status === 'sent' && <span className="pt-[4px] text-[10px] text-muted-light">{contractorSummary(q.counts)}</span>}
            </div>
            <div role="cell" className={`${cell} leading-[16px]`}>
              <span>by {q.created_by.name}</span>
              <span className="text-muted-grey">{formatDateTime(q.created_at)}</span>
            </div>
            <div role="cell" className={cell}>{q.due_date ? formatDate(q.due_date) : '—'}</div>
            <div role="cell" className={cell}><StatusBadge status={q.display_status} /></div>
          </div>
        ))}
      </div>
    </div>
  )
}
