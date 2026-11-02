import { fileKind } from '../../utils/files'

/** Coloured PDF / XLS / DOC tag shown before a file name. */
export function FileTag({ name, small = false }) {
  const kind = fileKind(name)
  return (
    <span className={`shrink-0 rounded-[3px] font-bold ${kind.className} ${small ? 'px-[5px] py-[3px] text-[8px]' : 'px-[7px] py-[4px] text-[9px]'}`}>
      {kind.label}
    </span>
  )
}

const STATUS = {
  awaiting: 'bg-[#fff5df] text-[#9c6b20] font-bold',
  received: 'bg-[#e8f5ed] text-[#27764e] font-bold',
  overdue: 'bg-[#fdebed] text-brand-bright font-semibold',
  not_quoting: 'bg-[rgba(128,128,128,0.1)] text-muted-grey font-bold',
  draft: 'bg-[#e8f2ff] text-[#295cbd] font-bold',
}

/** Overall quotation status (list and drawer header). */
export function StatusBadge({ status, showOverdueDays = true }) {
  if (!status) return null
  return (
    <span className="inline-flex flex-col items-start gap-[2px]">
      <span className={`rounded-[3px] px-[8px] py-[3px] text-[9px] ${STATUS[status.key] || STATUS.draft}`}>{status.label}</span>
      {showOverdueDays && status.key === 'overdue' && status.overdue_days > 0 && (
        <span className="text-[8px] text-brand-bright">by {status.overdue_days} {status.overdue_days === 1 ? 'day' : 'days'}</span>
      )}
    </span>
  )
}
