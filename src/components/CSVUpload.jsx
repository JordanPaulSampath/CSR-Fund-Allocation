import { useState } from 'react'

const SECTORS = ['Education', 'Healthcare', 'Environment', 'Livelihood', 'Water & Sanitation', 'Women Empowerment', 'Rural Development', 'Technology', 'Community Development']
const REGIONS = ['Maharashtra', 'Gujarat', 'Karnataka', 'Tamil Nadu', 'Rajasthan', 'Uttar Pradesh', 'Bihar', 'Odisha', 'West Bengal', 'Kerala', 'Madhya Pradesh', 'Northeast', 'Delhi NCR', 'Andhra Pradesh', 'Telangana']

export default function CSVUpload({ onImport, disabled }) {
  const [dragOver, setDragOver] = useState(false)
  const [parsing, setParsing] = useState(false)

  const parseCSV = (text) => {
    const lines = text.trim().split('\n')
    if (lines.length < 2) return []

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'))

    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim())
      const row = {}
      headers.forEach((h, i) => {
        row[h] = values[i] || ''
      })

      // Map CSV fields to API fields
      return {
        ngo_name: row.ngo_name || row.ngo || row.organization || row.name || '',
        sector: row.sector || row.category || row.focus_area || '',
        region: row.region || row.state || row.location || row.area || '',
        requested_amount: parseFloat(row.requested_amount || row.amount || row.budget || row.funds_requested || 0),
        impact_score: parseFloat(row.impact_score || row.impact || 0),
        feasibility_score: parseFloat(row.feasibility_score || row.feasibility || 0),
        cost_efficiency_score: parseFloat(row.cost_efficiency_score || row.cost_efficiency || row.cost || 0),
        reach_score: parseFloat(row.reach_score || row.reach || row.beneficiaries || 0),
        sustainability_score: parseFloat(row.sustainability_score || row.sustainability || 0),
        description: row.description || row.summary || '',
      }
    }).filter(r => r.ngo_name && r.requested_amount > 0)
  }

  const handleFile = async (file) => {
    if (!file) return
    setParsing(true)
    try {
      const text = await file.text()
      const rows = parseCSV(text)
      if (rows.length > 0) {
        await onImport(rows)
      }
    } catch (err) {
      console.error('CSV parse error:', err)
    } finally {
      setParsing(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && file.name.endsWith('.csv')) {
      handleFile(file)
    }
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={`relative ${dragOver ? 'scale-105' : ''} transition-transform`}
    >
      <input
        type="file"
        accept=".csv"
        onChange={(e) => handleFile(e.target.files[0])}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        disabled={disabled || parsing}
      />
      <div className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${
        dragOver
          ? 'bg-blue-100 border-2 border-dashed border-blue-400 text-blue-700'
          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 shadow-sm'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        {parsing ? 'Importing…' : 'Upload CSV'}
      </div>
    </div>
  )
}
