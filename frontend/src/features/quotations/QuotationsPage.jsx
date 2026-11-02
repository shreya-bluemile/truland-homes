import { useCallback, useEffect, useState } from 'react'
import api, { parseApiError } from '../../api/client'
import { FilterSelect } from '../../components/ui/Select'
import Pagination from '../../components/ui/Pagination'
import { useToast } from '../../components/ui/Toast'
import useLookups from '../../hooks/useLookups'
import QuotationsTable from './QuotationsTable'
import QuotationFormDrawer from './QuotationFormDrawer'
import QuotationDetailDrawer from './QuotationDetailDrawer'

const DATE_OPTIONS = [
  ['', 'All Dates'], ['today', 'Today'], ['7d', 'Last 7 days'], ['30d', 'Last 30 days'], ['month', 'This month'],
]
const EMPTY_FILTERS = { search: '', lot_id: '', category_id: '', date: '' }

export default function QuotationsPage() {
  const notify = useToast()
  const lookups = useLookups()
  const [draftFilters, setDraftFilters] = useState(EMPTY_FILTERS) // what's typed/selected
  const [filters, setFilters] = useState(EMPTY_FILTERS)           // what's applied (on Filter)
  const [page, setPage] = useState(1)
  const [result, setResult] = useState({ data: [], meta: null })
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [formFor, setFormFor] = useState(null)     // null | 'new' | quotation id (draft)
  const [detailId, setDetailId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = Object.fromEntries(Object.entries({ ...filters, page }).filter(([, v]) => v !== ''))
      const { data } = await api.get('/quotations', { params })
      setResult(data)
      setLoadError('')
    } catch (err) {
      setLoadError(parseApiError(err, 'Could not load quotations.').message)
    } finally {
      setLoading(false)
    }
  }, [filters, page])

  useEffect(() => { load() }, [load])

  const applyFilters = () => { setPage(1); setFilters(draftFilters) }
  const clearFilters = () => { setDraftFilters(EMPTY_FILTERS); setPage(1); setFilters(EMPTY_FILTERS) }
  const set = (key) => (value) => setDraftFilters((f) => ({ ...f, [key]: value }))

  const openQuotation = (q) => (q.status === 'draft' ? setFormFor(q.id) : setDetailId(q.id))

  const onSaved = (message, quotation) => {
    notify(message)
    setFormFor(null)
    load()
    if (quotation?.status === 'sent') setDetailId(null)
  }

  return (
    <section>
      <div className="flex items-start justify-between pt-[15px]">
        <div className="flex items-start gap-[10px]">
          <input
            type="search"
            value={draftFilters.search}
            onChange={(e) => set('search')(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            placeholder="Search by quote no."
            aria-label="Search by quote number"
            className="h-[33px] w-[272px] rounded-[3px] border-[0.5px] border-line-field bg-white px-[10px] text-[10px] text-ink outline-none placeholder:text-muted-grey focus:border-brand"
          />
          <FilterSelect value={draftFilters.lot_id} onChange={set('lot_id')} aria-label="Lot address" className="w-[142px]">
            <option value="">All Lot Addresses</option>
            {lookups.lots.map((l) => <option key={l.id} value={l.id}>{l.address}</option>)}
          </FilterSelect>
          <FilterSelect value={draftFilters.category_id} onChange={set('category_id')} aria-label="Category" className="w-[126px]">
            <option value="">All Categories</option>
            {lookups.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </FilterSelect>
          <FilterSelect value={draftFilters.date} onChange={set('date')} aria-label="Created date" className="w-[101px]">
            {DATE_OPTIONS.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
          </FilterSelect>
          <div className="flex w-[103px] flex-col items-end gap-[2px]">
            <button type="button" onClick={applyFilters}
              className="h-[34px] w-full rounded-[3px] bg-filter text-[12px] font-medium text-white hover:bg-[#4f5151]">
              Filter
            </button>
            <button type="button" onClick={clearFilters} className="text-[10px] font-medium text-brand-bright hover:underline">
              Clear Filter
            </button>
          </div>
        </div>
        <button type="button" onClick={() => setFormFor('new')}
          className="min-h-[30px] rounded-[3px] bg-brand px-[14px] py-[8px] text-[11px] font-bold text-white hover:bg-[#e01a29]">
          + Create Quotation
        </button>
      </div>

      <div className="pt-[13px]">
        <QuotationsTable rows={result.data} loading={loading} error={loadError} onRetry={load} onOpen={openQuotation} />
        <Pagination className="mt-[12px]" page={page} lastPage={result.meta?.last_page} onChange={setPage} />
      </div>

      {formFor !== null && (
        <QuotationFormDrawer
          quotationId={formFor === 'new' ? null : formFor}
          lookups={lookups}
          onClose={() => setFormFor(null)}
          onSaved={onSaved}
          onDeleted={(message) => { notify(message); setFormFor(null); load() }}
        />
      )}
      {detailId !== null && (
        <QuotationDetailDrawer quotationId={detailId} onClose={() => setDetailId(null)} onChanged={load} />
      )}
    </section>
  )
}
