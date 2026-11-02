import { ChevronDown } from './Icons'

/** Form dropdown (Create Quotation drawer style). */
export function Select({ value, onChange, children, invalid, className = '', ...props }) {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className={`h-[36px] w-full cursor-pointer appearance-none rounded-[4px] border-[0.909px] bg-white pl-[13px] pr-[36px] text-[12px] text-ink outline-none focus:border-brand ${invalid ? 'border-brand-bright' : 'border-line-input'}`}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-[13px] top-1/2 size-4 -translate-y-1/2 text-ink" />
    </div>
  )
}

/** Filter-bar dropdown (list page style: 34px tall, 10px grey text). */
export function FilterSelect({ value, onChange, children, className = '', ...props }) {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="h-[34px] w-full cursor-pointer appearance-none rounded-[3px] border-[0.5px] border-line-field bg-white pl-[10px] pr-[30px] text-[10px] text-muted-grey outline-none focus:border-brand"
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-[9px] top-1/2 size-[13px] -translate-y-1/2 text-[#4a4a4a]" />
    </div>
  )
}

export function FieldLabel({ children, required, htmlFor, className = '' }) {
  return (
    <label htmlFor={htmlFor} className={`block text-[12px] font-bold text-ink-label ${className}`}>
      {children}
      {required && <span className="text-brand"> *</span>}
    </label>
  )
}

export function FieldError({ children }) {
  return children ? <p role="alert" className="mt-[4px] text-[11px] text-brand-bright">{children}</p> : null
}
