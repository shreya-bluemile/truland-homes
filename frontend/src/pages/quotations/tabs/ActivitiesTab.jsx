import { useEffect, useState } from 'react'
import api, { parseApiError } from '../../../api/client'
import { formatDate, formatTime } from '../../../lib/format'

export default function ActivitiesTab({ quotation: q }) {
  const [page, setPage] = useState(1)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get(`/quotations/${q.id}/activities`, { params: { page } })
      .then(({ data: d }) => setData(d))
      .catch((e) => setError(parseApiError(e).message))
  }, [q.id, page])

  return (
    <div className="px-[24px] pb-[32px] pt-[22px]">
      {error && <p role="alert" className="text-[11px] text-brand-bright">{error}</p>}
      {data?.data.length === 0 && <p className="py-[20px] text-center text-[12px] text-muted-grey">No activity yet.</p>}
      <ul className="flex flex-col gap-[28px]">
        {data?.data.map((a) => (
          <li key={a.id} className="flex items-center gap-[20px]">
            <span className="flex h-[36px] w-[37px] shrink-0 items-center justify-center rounded-full bg-[rgba(255,0,22,0.22)] text-[14px] font-medium text-brand-bright">
              {a.actor.charAt(0).toUpperCase()}
            </span>
            <div className="flex flex-col gap-[5px]">
              <p className="text-[14px] font-medium text-black">{a.description}</p>
              <p className="text-[12px] text-muted-grey">{formatTime(a.created_at, { padHour: false })} | {formatDate(a.created_at)} by {a.actor}</p>
            </div>
          </li>
        ))}
      </ul>
      {data && data.last_page > 1 && (
        <nav aria-label="Activity pages" className="mt-[24px] flex items-center justify-end gap-[6px] text-[10px]">
          <button type="button" disabled={page === 1} onClick={() => setPage(page - 1)} aria-label="Previous page" className="px-[4px] text-muted disabled:opacity-40">‹</button>
          {Array.from({ length: data.last_page }, (_, i) => i + 1).map((n) => (
            <button key={n} type="button" onClick={() => setPage(n)} aria-current={n === page ? 'page' : undefined}
              className={`size-[17px] rounded-[2px] ${n === page ? 'bg-brand-bright text-white' : 'text-ink-sub hover:bg-surface-panel'}`}>{n}</button>
          ))}
          <button type="button" disabled={page === data.last_page} onClick={() => setPage(page + 1)} aria-label="Next page" className="px-[4px] text-muted disabled:opacity-40">›</button>
        </nav>
      )}
    </div>
  )
}
