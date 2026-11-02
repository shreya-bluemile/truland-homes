import { useRef, useState } from 'react'
import dropzoneImage from '../../assets/figma/upload-dropzone.png'

/**
 * "Drag and drop a file here or click" box from the Figma file. Calls onFiles with the picked files.
 * size="sm" is the compact version used in the Notes tab.
 */
export default function Dropzone({ onFiles, multiple = true, accept, size = 'md', className = '', label = 'Upload a file' }) {
  const input = useRef(null)
  const [over, setOver] = useState(false)
  const pick = (list) => {
    const files = Array.from(list || [])
    if (files.length) onFiles(multiple ? files : files.slice(0, 1))
  }
  const sm = size === 'sm'

  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => input.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setOver(true) }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); pick(e.dataTransfer.files) }}
      className={`flex w-full flex-col items-center justify-center border-solid border-line-field bg-white ${
        sm ? 'h-[62px] rounded-[5px] border py-[7px]' : 'h-[78px] border-[0.3px] py-[7px]'
      } ${over ? 'bg-surface-panel ring-1 ring-brand' : ''} ${className}`}
    >
      <img src={dropzoneImage} alt="" className={sm ? 'h-[30.07px] w-[81.511px]' : 'h-[50px] w-[135px]'} />
      <span className={`font-medium text-[#cecece] ${sm ? 'text-[5px]' : 'text-[7px]'}`}>Max 10MB per image</span>
      <input
        ref={input}
        type="file"
        hidden
        multiple={multiple}
        accept={accept}
        onChange={(e) => { pick(e.target.files); e.target.value = '' }}
      />
    </button>
  )
}
