import { useCallback, useEffect, useState } from 'react'
import api, { parseApiError } from '../../api/client'
import { StatusBadge } from '../../components/ui/Badges'
import Drawer, { CloseButton } from '../../components/ui/Drawer'
import ActivitiesTab from './tabs/ActivitiesTab'
import ContractorsTab from './tabs/ContractorsTab'
import DetailsTab from './tabs/DetailsTab'
import NotesTab from './tabs/NotesTab'

const TABS = ['Details', 'Contractors', 'Notes', 'Activities']

/** Quotation detail drawer: Details, Contractors, Notes and Activities tabs. */
export default function QuotationDrawer({ quotationId, onClose, onChanged }) {
  const [tab, setTab] = useState('Details')
  const [quotation, setQuotation] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    if (!quotationId) return
    api.get(`/quotations/${quotationId}`)
      .then(({ data }) => { setQuotation(data.data); setError('') })
      .catch((e) => setError(parseApiError(e).message))
  }, [quotationId])

  useEffect(() => { setTab('Details'); setQuotation(null); load() }, [load])

  const changed = () => { load(); onChanged() }
  const q = quotation

  const header = (
    <>
      <div className="flex items-center justify-between px-[22px] pb-[12px] pt-[16px]">
        <div>
          <p className="text-[10px] font-bold text-muted">{q?.number}</p>
          <div className="flex items-center gap-[5px] pt-[2px]">
            <h1 className="text-[15px] font-bold text-ink">{q ? q.lot_address : 'Loading…'}</h1>
            {q && tab === 'Details' && <StatusBadge status={q.status} />}
          </div>
        </div>
        <CloseButton onClick={onClose} />
      </div>
      <div role="tablist" className="flex items-center gap-[15px] px-[28px] pt-[13px]">
        {TABS.map((name) => {
          const label = name === 'Contractors' && tab === name && q ? `Contractors (${q.recipients.length})` : name
          const active = tab === name
          return (
            <button
              key={name}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(name)}
              className={active
                ? 'flex h-[28px] min-w-[61px] items-center justify-center rounded-t-[7px] border-b-2 border-brand-bright bg-white px-[7px] text-[11px] text-brand-bright shadow-tab'
                : 'text-[12px] text-black hover:text-brand'}
            >
              {label}
            </button>
          )
        })}
      </div>
    </>
  )

  return (
    <Drawer open={Boolean(quotationId)} onClose={onClose} header={header} width={tab === 'Contractors' ? 844 : 680} label="Quotation details">
      {error && <p role="alert" className="m-[22px] rounded-[4px] bg-[#fdebed] px-[12px] py-[10px] text-[11px] text-brand-bright">{error}</p>}
      {q && tab === 'Details' && <DetailsTab quotation={q} />}
      {q && tab === 'Contractors' && <ContractorsTab quotation={q} onChanged={changed} />}
      {q && tab === 'Notes' && <NotesTab quotation={q} onChanged={changed} />}
      {q && tab === 'Activities' && <ActivitiesTab quotation={q} />}
    </Drawer>
  )
}
