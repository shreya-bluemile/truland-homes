/** Classes for a text input or textarea in the form drawers. */
export const inputClass = (invalid) =>
  `w-full rounded-[4px] border-[0.909px] bg-white px-[13px] py-[10px] text-[12px] text-ink outline-none placeholder:text-muted-light focus:border-brand ${invalid ? 'border-brand-bright' : 'border-line-input'}`
