import { useCallback, useEffect, useState } from 'react'
import api, { parseApiError } from '../../api/client'
import Drawer, { CloseButton } from '../../components/ui/Drawer'
import { StatusBadge } from '../../components/ui/Badges'
import DetailsTab from './DetailsTab'
import ContractorsTab from './ContractorsTab'
import NotesTab from './NotesTab'
import ActivitiesTab from './ActivitiesTab'

const TABS = ['Details', 'Contractors', 'Notes', 'Activities']

export default function QuotationDetailDrawer({ quotationId, onClose, onChanged }) {
  const [tab, setTab] = useState('Details')
  const [quotation, setQuotation] = useState(null)
  const [error, setError] = useState('')
  const [activityVersion, setActivityVersion] = useState(0) // bump to refresh the activity log

  const load = useCallback(() => {
    return api.get(`/quotations/${quotationId}`)
      .then(({ data }) => { setQuotation(data.data); setError('') })
      .catch((err) => setError(parseApiError(err, 'Could not load this quotation.').message))
  }, [quotationId])

  useEffect(() => { load() }, [load])

  /** Called by tabs after they change something: refresh this drawer, the list and the log. */
  const changed = useCallback(() => {
    load()
    onChanged()
    setActivityVersion((v) => v + 1)
  }, [load, onChanged])

  return (
    <Drawer open onClose={onClose} width={tab === 'Contractors' ? 844 : 680} label={quotation ? `Quotation ${quotation.quote_no}` : 'Quotation'}>
      <div className="flex items-center justify-between px-[22px] pb-[12px] pt-[16px]">
        <div>
          <p className="text-[10px] font-bold text-muted">{quotation?.quote_no}</p>
          <div className="flex items-center gap-[5px] pt-[2px]">
            <h1 className="text-[15px] font-bold text-ink">{quotation?.lot.address || (error ? 'Quotation' : 'Loading…')}</h1>
            {quotation && <StatusBadge status={quotation.display_status} showOverdueDays={false} />}
          </div>
        </div>
        <CloseButton onClick={onClose} />
      </div>

      <div role="tablist" aria-label="Quotation sections" className="flex items-center gap-[15px] px-[28px] pt-[13px]">
        {TABS.map((name) => {
          const active = tab === name
          const label = name === 'Contractors' && active && quotation ? `Contractors (${quotation.recipients.length})` : name
          return (
            <button key={name} type="button" role="tab" aria-selected={active} onClick={() => setTab(name)}
              className={active
                ? 'flex h-[28px] min-w-[61px] items-center justify-center rounded-t-[7px] border-b-2 border-brand-bright bg-white px-[7px] text-[11px] text-brand-bright drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]'
                : 'h-[28px] text-[12px] text-black hover:text-brand-bright'}>
              {label}
            </button>
          )
        })}
      </div>

      <div role="tabpanel" className="flex-1 overflow-y-auto">
        {error && <p role="alert" className="m-[22px] rounded-[4px] bg-[#fdebed] px-[12px] py-[10px] text-[11px] text-[#a3000e]">{error}</p>}
        {!quotation && !error && <p className="py-10 text-center text-[12px] text-muted">Loading…</p>}
        {quotation && tab === 'Details' && <DetailsTab quotation={quotation} />}
        {quotation && tab === 'Contractors' && <ContractorsTab quotation={quotation} onChanged={changed} />}
        {quotation && tab === 'Notes' && <NotesTab quotationId={quotation.id} onChanged={() => setActivityVersion((v) => v + 1)} />}
        {quotation && tab === 'Activities' && <ActivitiesTab quotationId={quotation.id} version={activityVersion} />}
      </div>
    </Drawer>
  )
}
