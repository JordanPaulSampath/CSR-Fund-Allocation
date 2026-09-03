import { useState, useRef } from 'react'

export default function CSVUpload({ onUpload, disabled }) {
  const [dragOver, setDragOver] = useState(false)
  const [fileName, setFileName] = useState(null)
  const inputRef = useRef(null)

  const handleFile = async (file) => {
    if (!file || !file.name.endsWith('.csv')) return
    setFileName(file.name)
    await onUpload(file)
    setFileName(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div onDragOver={e => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}>
      <input ref={inputRef} type="file" accept=".csv"
        onChange={e => handleFile(e.target.files[0])}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        disabled={disabled} />
      <div className="btn-secondary cursor-pointer flex items-center gap-2"
        style={dragOver ? { borderColor: 'var(--petrol)', background: 'rgba(31,75,67,0.03)' } : {}}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
        {fileName ? `Uploading ${fileName}…` : 'Upload CSV'}
      </div>
    </div>
  )
}
