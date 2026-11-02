import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import api, { parseApiError } from '../../api/client'
import { StatusBadge } from '../../components/ui/Badges'
import { FilterSelect } from '../../components/ui/SelectField'
import { formatDate, formatDateTime } from '../../lib/format'
import QuotationDrawer from './QuotationDrawer'
import QuotationFormDrawer from './QuotationFormDrawer'

const EMPTY_FILTERS = { search: '', lot_id: '', category_id: '', date: '' }
const COLUMNS = ['Quote No.', 'Lot Address', 'Category', 'Contractors', 'Created Details', 'Due Date', 'Status']
const cell = 'border-b-[0.909px] border-line-soft p-[11px] align-middle text-[11px] text-ink-soft'

export default function QuotationsPage() {
  const [params, setParams] = useSearchParams()
  const [options, setOptions] = useState({ lots: [], categories: [] })
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')
  const openId = params.get('quote')
  const editId = params.get('edit')
  const creating = params.get('new') === '1'

  const load = useCallback((applied) => {
    setError('')
    const query = Object.fromEntries(Object.entries(applied).filter(([, v]) => v))
    api.get('/quotations', { params: query })
      .then(({ data }) => setRows(data.data))
      .catch((e) => { setRows([]); setError(parseApiError(e).message) })
  }, [])

  useEffect(() => {
    load(EMPTY_FILTERS)
    api.get('/quotation-options').then(({ data }) => setOptions(data)).catch(() => {})
  }, [load])

  const set = (key) => (value) => setFilters((f) => ({ ...f, [key]: value }))
  const clear = () => { setFilters(EMPTY_FILTERS); load(EMPTY_FILTERS) }
  const go = (next) => setParams(next, { replace: false })
  const refresh = () => load(filters)
  const open = (row) => go(row.status === 'draft' ? { edit: row.id } : { quote: row.id })

  return (
    <section>
      <div className="flex items-start justify-between">
        <form className="flex items-start gap-[10px]" onSubmit={(e) => { e.preventDefault(); load(filters) }}>
          <input
            value={filters.search}
            onChange={(e) => set('search')(e.target.value)}
            placeholder="Search by quote no."
            aria-label="Search by quote number"
            className="h-[33px] w-[272px] rounded-[3px] border-[0.5px] border-line-field bg-white px-[10px] text-[10px] text-ink outline-none placeholder:text-muted-grey focus:border-brand"
          />
          <FilterSelect value={filters.lot_id} onChange={set('lot_id')} aria-label="Lot address" className="w-[144px]">
            <option value="">All Lot Addresses</option>
            {options.lots.map((lot) => <option key={lot.id} value={lot.id}>{lot.address}</option>)}
          </FilterSelect>
          <FilterSelect value={filters.category_id} onChange={set('category_id')} aria-label="Category" className="w-[127px]">
            <option value="">All Categories</option>
            {options.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </FilterSelect>
          <FilterSelect value={filters.date} onChange={set('date')} aria-label="Created date" className="w-[103px]">
            <option value="">All Dates</option>
            <option value="today">Today</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="month">This month</option>
          </FilterSelect>
          <div className="flex w-[103px] flex-col items-end gap-[2px]">
            <button type="submit" className="h-[34px] w-full rounded-[3px] bg-filter text-[12px] font-medium text-white hover:bg-[#4f5151]">Filter</button>
            <button type="button" onClick={clear} className="text-[10px] font-medium text-brand-bright hover:underline">Clear Filter</button>
          </div>
        </form>
        <button
          type="button"
          onClick={() => go({ new: '1' })}
          className="min-h-[30px] rounded-[3px] bg-brand px-[14px] py-[8px] text-[11px] font-bold text-white hover:bg-brand-dark"
        >
          + Create Quotation
        </button>
      </div>

      <div className="mt-[13px] overflow-hidden rounded-[4px] border-[0.909px] border-line bg-white">
        <table className="w-full min-w-[790px] table-fixed border-collapse">
          <thead>
            <tr>
              {COLUMNS.map((c) => (
                <th key={c} className="h-[30.909px] bg-surface-head px-[11px] text-left text-[10px] font-bold uppercase text-[#46515a]">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows === null && <EmptyRow>Loading…</EmptyRow>}
            {rows?.length === 0 && <EmptyRow>{error || 'No quotations yet.'}</EmptyRow>}
            {rows?.map((row) => (
              <tr key={row.id} onClick={() => open(row)} className="h-[50px] cursor-pointer last:[&>td]:border-b-0 hover:bg-surface-subtle">
                <td className={cell}>
                  <button type="button" onClick={(e) => { e.stopPropagation(); open(row) }} className="font-semibold text-brand-bright hover:underline">
                    {row.number}
                  </button>
                </td>
                <td className={cell}>{row.lot_address}</td>
                <td className={cell}>{row.category}</td>
                <td className={cell}>
                  <div>{row.contractor_count} {row.contractor_count === 1 ? 'contractor' : 'contractors'}</div>
                  <div className="pt-[4px] text-[10px] text-muted-light">
                    {row.quoted_count} quoted{row.opened_count > 0 && ` · ${row.opened_count} opened`}
                  </div>
                </td>
                <td className={`${cell} leading-[16px]`}>
                  <div>by {row.created_by}</div>
                  <div className="text-muted-grey">{formatDateTime(row.created_at)}</div>
                </td>
                <td className={cell}>{formatDate(row.due_date) || '—'}</td>
                <td className={cell}>
                  <StatusBadge status={row.status} />
                  {row.status === 'overdue' && (
                    <div className="mt-[2px] text-[8px] text-brand-bright">by {row.overdue_days} {row.overdue_days === 1 ? 'day' : 'days'}</div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <QuotationFormDrawer
        open={creating || Boolean(editId)}
        quotationId={editId}
        options={options}
        onClose={() => go({})}
        onSaved={(q, sent) => { refresh(); go(sent ? { quote: q.id } : {}) }}
      />
      <QuotationDrawer quotationId={openId} onClose={() => go({})} onChanged={refresh} />
    </section>
  )
}

function EmptyRow({ children }) {
  return (
    <tr>
      <td colSpan={COLUMNS.length} className="py-[80px] text-center text-[12px] leading-[17.4px] text-muted-grey">{children}</td>
    </tr>
  )
}
