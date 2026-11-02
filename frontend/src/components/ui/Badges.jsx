import { fileKind } from '../../lib/format'

const KIND_STYLES = {
  PDF: 'bg-[#ffe8e8] text-brand',
  XLS: 'bg-[#e0f5e5] text-[#1c7d40]',
  DOC: 'bg-[#e8f2ff] text-[#295cbd]',
  IMG: 'bg-[#f1f4f6] text-ink-sub',
}

/** PDF / XLS label in front of a file name. size="sm" is the compact attachment-card version. */
export function FileTypeBadge({ name, size = 'md' }) {
  const kind = fileKind(name)
  const box = size === 'sm' ? 'px-[5px] py-[3px] text-[8px]' : 'px-[7px] py-[4px] text-[9px]'
  return <span className={`shrink-0 rounded-[3px] font-bold leading-none ${box} ${KIND_STYLES[kind]}`}>{kind}</span>
}

const STATUS = {
  awaiting: ['Awaiting', 'bg-[#fff5df] text-[#9c6b20] font-bold'],
  received: ['Received', 'bg-[#e8f5ed] text-[#27764e] font-bold'],
  overdue: ['Overdue', 'bg-[#fdebed] text-brand-bright font-semibold'],
  not_quoting: ['Not Quoting', 'bg-[rgba(128,128,128,0.1)] text-muted-grey font-bold'],
  draft: ['Draft', 'bg-[#e8f2ff] text-[#295cbd] font-bold'],
}

/** Overall quotation status pill (list and drawer header). */
export function StatusBadge({ status }) {
  const [label, style] = STATUS[status] || STATUS.awaiting
  return <span className={`inline-flex items-center justify-center whitespace-nowrap rounded-[3px] px-[8px] py-[4px] text-[9px] leading-none ${style}`}>{label}</span>
}
