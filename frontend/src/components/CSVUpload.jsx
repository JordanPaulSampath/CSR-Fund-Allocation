import { useState, useRef } from 'react'

export default function CSVUpload({ onUpload, disabled }) {
  const [dragOver, setDragOver] = useState(false)
  const [fileName, setFileName] = useState(null)
  const inputRef = useRef(null)

  const handleFile = async (file) => {
    if (!file || !file.name.toLowerCase().endsWith('.csv')) return
    setFileName(file.name)
    try {
      await onUpload(file)
    } finally {
      setFileName(null)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const pick = () => { if (!disabled) inputRef.current?.click() }

  return (
    // position:relative + inline-block so the hidden <input> is scoped to THIS
    // button only — previously it stretched across the whole page (inset-0 with
    // no positioned ancestor), so clicking anywhere opened the file dialog.
    <div
      className="relative inline-block"
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        onChange={(e) => handleFile(e.target.files[0])}
        disabled={disabled}
        tabIndex={-1}
        aria-hidden="true"
        style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
      />
      <button
        type="button"
        onClick={pick}
        disabled={disabled}
        className="btn-secondary flex items-center gap-2"
        style={dragOver ? { borderColor: 'var(--petrol)', background: 'var(--petrol-soft)' } : {}}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
        {fileName ? `Uploading ${fileName}…` : 'Upload CSV'}
      </button>
    </div>
  )
}
