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
      onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
      className={dragOver ? 'scale-105' : ''} style={{ transition: 'transform 0.15s' }}>
      <input ref={inputRef} type="file" accept=".csv"
        onChange={e => handleFile(e.target.files[0])}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        disabled={disabled} />
      <div className={`px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 cursor-pointer ${
        dragOver ? 'bg-blue-100 border-2 border-dashed border-blue-400 text-blue-700' :
        'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 shadow-sm'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        {fileName ? `Uploading ${fileName}…` : 'Upload CSV'}
      </div>
    </div>
  )
}
