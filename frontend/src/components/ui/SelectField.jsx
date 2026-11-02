import chevron from '../../assets/figma/chevron-down.svg'
import filterChevron from '../../assets/figma/filter-chevron.png'

/** Native select styled as the Figma "Dropdown" (form fields in the drawers). */
export function SelectField({ value, onChange, children, invalid, ...props }) {
  return (
    <div className="relative w-full">
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className={`h-[38px] w-full appearance-none rounded-[4px] border-[0.909px] bg-white pl-[13px] pr-[36px] text-[12px] text-ink outline-none focus:border-brand ${
          invalid ? 'border-brand' : 'border-line-input'
        }`}
        {...props}
      >
        {children}
      </select>
      <img src={chevron} alt="" width="16" height="16" className="pointer-events-none absolute right-[13px] top-1/2 -translate-y-1/2" />
    </div>
  )
}

/** Small select used in the list filter bar. */
export function FilterSelect({ value, onChange, children, className = '', ...props }) {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-[34px] w-full appearance-none rounded-[3px] border-[0.5px] border-line-field bg-white pl-[10px] pr-[30px] text-[10px] text-muted-grey outline-none focus:border-brand"
        {...props}
      >
        {children}
      </select>
      <img src={filterChevron} alt="" className="pointer-events-none absolute right-[10px] top-1/2 h-[11px] w-[10px] -translate-y-1/2 object-cover" />
    </div>
  )
}

export function FieldLabel({ children, required, className = '' }) {
  return (
    <label className={`block text-[12px] font-bold text-ink-label ${className}`}>
      {children} {required && <span className="text-brand">*</span>}
    </label>
  )
}

export function FieldError({ children }) {
  return children ? <p className="mt-[4px] text-[11px] text-brand">{children}</p> : null
}
