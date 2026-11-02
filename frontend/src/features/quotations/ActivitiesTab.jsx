import { useEffect, useState } from 'react'
import api, { parseApiError } from '../../api/client'
import Pagination from '../../components/ui/Pagination'
import { formatActivityDate, initial } from '../../utils/format'

export default function ActivitiesTab({ quotationId, version }) {
  const [page, setPage] = useState(1)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get(`/quotations/${quotationId}/activities`, { params: { page } })
      .then(({ data }) => { setResult(data); setError('') })
      .catch((err) => setError(parseApiError(err, 'Could not load the activity log.').message))
  }, [quotationId, page, version])

  return (
    <div className="px-[24px] py-[22px]">
      {error && <p role="alert" className="text-[11px] text-brand-bright">{error}</p>}
      {!result && !error && <p className="text-[12px] text-muted">Loading…</p>}
      {result?.data.length === 0 && <p className="text-[12px] text-muted">No activity yet.</p>}
      <ol className="flex flex-col gap-[24px]">
        {result?.data.map((a) => (
          <li key={a.id} className="flex items-center gap-[17px]">
            <span className="flex size-[32px] shrink-0 items-center justify-center rounded-full bg-[#ffcbd1] text-[14px] text-brand-bright">{initial(a.actor_name)}</span>
            <div>
              <p className="text-[13px] text-black">{a.description}</p>
              <p className="text-[11px] text-muted">{formatActivityDate(a.created_at)} by {a.actor_name}</p>
            </div>
          </li>
        ))}
      </ol>
      <Pagination className="mt-[22px]" page={page} lastPage={result?.meta?.last_page} onChange={setPage} />
    </div>
  )
}
