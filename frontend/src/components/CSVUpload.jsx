import { useState, useRef } from 'react'

// A plain button that opens a hidden <input type=file>. No absolute/overlay
// positioning anywhere — the input is display:none and only ever triggered by
// the button's onClick. Drag-and-drop is scoped to the button element itself.
export default function CSVUpload({ onUpload, disabled }) {
  const [dragOver, setDragOver] = useState(false)
  const [busy, setBusy] = useState(false)
  const inputRef = useRef(null)

  const handleFile = async (file) => {
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.csv')) return
    setBusy(true)
    try {
      await onUpload(file)
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        hidden
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <button
        type="button"
        disabled={disabled || busy}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          handleFile(e.dataTransfer.files?.[0])
        }}
        className="btn-secondary inline-flex items-center gap-2"
        style={dragOver ? { borderColor: 'var(--petrol)', background: 'var(--petrol-soft)' } : undefined}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
        {busy ? 'Uploading…' : 'Upload CSV'}
      </button>
    </>
  )
}
