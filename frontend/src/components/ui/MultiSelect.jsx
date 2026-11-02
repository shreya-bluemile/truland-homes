import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from './Icons'

/** Contractors picker: selected names shown as grey chips, checkbox list underneath. */
export default function MultiSelect({ options, value, onChange, placeholder, disabled, invalid, id }) {
  const [open, setOpen] = useState(false)
  const box = useRef(null)

  useEffect(() => {
    if (!open) return
    const close = (e) => !box.current?.contains(e.target) && setOpen(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  const selected = options.filter((o) => value.includes(o.id))
  const toggle = (id) => onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id])

  return (
    <div ref={box} className="relative">
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`flex min-h-[36px] w-full items-center justify-between gap-2 rounded-[4px] border-[0.909px] bg-white px-[13px] py-[4px] text-left outline-none focus:border-brand disabled:cursor-not-allowed disabled:bg-surface-panel ${invalid ? 'border-brand-bright' : 'border-line-input'}`}
      >
        <span className="flex flex-1 flex-wrap items-center gap-[5px] py-[2px]">
          {selected.length === 0 && <span className="text-[12px] text-muted-light">{placeholder}</span>}
          {selected.map((o) => (
            <span key={o.id} className="rounded-[2px] bg-page px-[7px] py-[4px] text-[10px] text-ink-sub">{o.name}</span>
          ))}
        </span>
        <ChevronDown className="size-4 shrink-0 text-ink" />
      </button>
      {open && (
        <ul role="listbox" aria-multiselectable="true"
          className="absolute z-10 mt-1 max-h-[240px] w-full overflow-auto rounded-[6px] border border-line bg-white py-[6px] shadow-menu">
          {options.length === 0 && <li className="px-[12px] py-[8px] text-[12px] text-muted">No active contractors in this category.</li>}
          {options.map((o) => (
            <li key={o.id} role="option" aria-selected={value.includes(o.id)}>
              <label className="flex cursor-pointer items-center gap-[8px] px-[12px] py-[8px] text-[12px] text-ink hover:bg-surface-panel">
                <input type="checkbox" className="accent-brand" checked={value.includes(o.id)} onChange={() => toggle(o.id)} />
                <span className="flex-1">{o.name}</span>
                <span className="text-[11px] text-muted">{o.email}</span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
