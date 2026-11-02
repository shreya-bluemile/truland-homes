/** Page buttons: ‹ 1 2 … 9 › with the current page in red. Hidden when there is only one page. */
export default function Pagination({ page, lastPage, onChange, className = '' }) {
  if (!lastPage || lastPage <= 1) return null
  const pages = []
  for (let p = 1; p <= lastPage; p++) {
    if (p === 1 || p === lastPage || Math.abs(p - page) <= 1) pages.push(p)
    else if (pages[pages.length - 1] !== '…') pages.push('…')
  }
  const btn = 'flex h-[22px] min-w-[22px] items-center justify-center rounded-[3px] border border-line px-[6px] text-[10px] text-ink-sub disabled:opacity-40'
  return (
    <nav aria-label="Pagination" className={`flex items-center justify-end gap-[6px] ${className}`}>
      <button type="button" className={btn} disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page">‹</button>
      {pages.map((p, i) => p === '…'
        ? <span key={`gap${i}`} className={`${btn} border-transparent`}>…</span>
        : <button key={p} type="button" onClick={() => onChange(p)} aria-current={p === page ? 'page' : undefined}
            className={`${btn} ${p === page ? 'border-brand-bright bg-brand-bright font-semibold text-white' : ''}`}>{p}</button>)}
      <button type="button" className={btn} disabled={page >= lastPage} onClick={() => onChange(page + 1)} aria-label="Next page">›</button>
    </nav>
  )
}
