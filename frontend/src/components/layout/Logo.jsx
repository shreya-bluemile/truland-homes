/**
 * Truland Homes wordmark. Built from live text exactly as in the Figma header
 * ("TRU" black weight in red, "LAND" bold, spaced "HOMES" below).
 * variant="light" is for the dark header, variant="dark" for white pages.
 */
export default function Logo({ variant = 'light', size = 'sm' }) {
  const land = variant === 'light' ? 'text-white' : 'text-[#2b2b2b]'
  const homes = variant === 'light' ? 'text-white' : 'text-[#2b2b2b]'
  if (size === 'lg') {
    return (
      <div className="inline-flex flex-col items-center leading-none" aria-label="Truland Homes">
        <span className="text-[40px] tracking-[0.5px]">
          <span className="font-black text-[#ff0016]">TRU</span>
          <span className={`font-bold ${land}`}>LAND</span>
        </span>
        <span className={`mt-[6px] text-[22px] font-medium tracking-[8px] pl-[8px] ${homes}`}>HOMES</span>
      </div>
    )
  }
  return (
    <div className="flex w-[168px] flex-col leading-none" aria-label="Truland Homes">
      <span className="text-[21px] tracking-[1px] leading-[16px]">
        <span className="font-black text-[#ff2637]">TRU</span>
        <span className={`font-bold ${land}`}>LAND</span>
      </span>
      <span className={`mt-[1px] pl-[18px] text-[11px] font-bold leading-[10px] tracking-[4px] ${homes}`}>H O M E S</span>
    </div>
  )
}
