import { Children } from 'react'

/** Shared bits for the simple management pages (Contractors, Settings). */

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="flex items-end justify-between pt-[15px]">
      <div>
        <h1 className="text-[16px] font-bold text-ink">{title}</h1>
        {subtitle && <p className="pt-[3px] text-[11px] text-muted">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-[10px]">{children}</div>
    </div>
  )
}

export function SearchInput({ value, onChange, onEnter, placeholder, width = 272 }) {
  return (
    <input type="search" value={value} onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => e.key === 'Enter' && onEnter?.()}
      placeholder={placeholder} aria-label={placeholder} style={{ width }}
      className="h-[33px] rounded-[3px] border-[0.5px] border-line-field bg-white px-[10px] text-[10px] text-ink outline-none placeholder:text-muted-grey focus:border-brand" />
  )
}

export const primaryButton = 'min-h-[30px] rounded-[3px] bg-brand px-[14px] py-[8px] text-[11px] font-bold text-white hover:bg-[#e01a29] disabled:opacity-60'
export const secondaryButton = 'min-h-[30px] rounded-[3px] border-[0.909px] border-[#d8dde1] bg-white px-[14px] py-[8px] text-[11px] text-[#525e67] hover:bg-surface-panel disabled:opacity-60'
export const linkButton = 'text-[11px] font-semibold text-brand hover:underline disabled:opacity-50'

export function Table({ columns, ariaLabel, children, empty, loading, error, onRetry }) {
  const hasRows = Children.count(children) > 0
  return (
    <div className="mt-[13px] overflow-hidden rounded-[4px] border-[0.909px] border-line bg-white">
      <table aria-label={ariaLabel} className="w-full border-collapse">
        <thead>
          <tr className="bg-surface-head">
            {columns.map(([label, width], i) => (
              <th key={i} style={width ? { width } : undefined}
                className={`h-[31px] px-[11px] text-left text-[10px] font-bold text-[#46515a] ${label === 'ACTION' ? 'text-right' : ''}`}>{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading && <tr><td colSpan={columns.length} className="py-[60px] text-center text-[11px] text-muted-grey">Loading…</td></tr>}
          {!loading && error && (
            <tr><td colSpan={columns.length} className="py-[60px] text-center text-[11px] text-brand-bright">
              {error} <button type="button" onClick={onRetry} className="font-semibold underline">Try again</button>
            </td></tr>
          )}
          {!loading && !error && !hasRows && <tr><td colSpan={columns.length} className="py-[60px] text-center text-[11px] text-muted-grey">{empty}</td></tr>}
          {!loading && !error && children}
        </tbody>
      </table>
    </div>
  )
}

export const td = 'border-t-[0.909px] border-line-soft px-[11px] py-[13px] text-[11px] text-ink-soft align-middle'

export function ActiveBadge({ active }) {
  return (
    <span className={`rounded-[3px] px-[8px] py-[3px] text-[9px] font-bold ${active ? 'bg-[#e8f5ed] text-[#27764e]' : 'bg-[rgba(128,128,128,0.1)] text-muted-grey'}`}>
      {active ? 'Active' : 'Inactive'}
    </span>
  )
}
