import { useRef, useState } from 'react'
import { UploadCloud } from './Icons'

/** "Drag and drop a file here or click" box. Calls onFiles with the chosen File objects. */
export default function FileDropzone({ onFiles, multiple = true, accept, compact = false, className = '', inputRef }) {
  const [over, setOver] = useState(false)
  const localRef = useRef(null)
  const input = inputRef || localRef

  const take = (list) => {
    const files = Array.from(list || [])
    if (files.length) onFiles(multiple ? files : files.slice(0, 1))
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => input.current?.click()}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), input.current?.click())}
      onDragOver={(e) => { e.preventDefault(); setOver(true) }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); take(e.dataTransfer.files) }}
      className={`flex w-full cursor-pointer flex-col items-center justify-center bg-white text-center transition-colors ${over ? 'border-brand bg-[#fff7f7]' : 'border-line-field'} ${compact ? 'h-[62px] rounded-[5px] border' : 'h-[78px] border-[0.5px]'} ${className}`}
    >
      <UploadCloud className={compact ? 'h-[22px] w-[30px]' : 'h-[30px] w-[42px]'} />
      <p className={`mt-[3px] text-[#b5b5b5] ${compact ? 'text-[8px]' : 'text-[9px]'}`}>
        Drag and drop a file here or <span className="text-brand">click</span>
      </p>
      <p className="text-[7px] text-[#cecece]">Max 10MB per file</p>
      <input ref={input} type="file" hidden multiple={multiple} accept={accept}
        onChange={(e) => { take(e.target.files); e.target.value = '' }} />
    </div>
  )
}
