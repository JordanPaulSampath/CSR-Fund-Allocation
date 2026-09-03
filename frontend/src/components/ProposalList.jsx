import { useState } from 'react'

function formatCurrency(amount) {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`
  return `₹${amount.toLocaleString('en-IN')}`
}

function ScoreBar({ score }) {
  const pct = Math.min((score / 10) * 100, 100)
  return (
    <div className="flex items-center gap-2">
      <div className="score-bar">
        <div className="score-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="font-serif text-xs tabular" style={{ color: 'var(--ink)', minWidth: '24px' }}>
        {score.toFixed(1)}
      </span>
    </div>
  )
}

export default function ProposalList({ proposals, loading, onLoadSample }) {
  const [sortField, setSortField] = useState('final_score')
  const [sortDir, setSortDir] = useState('desc')

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortField(field); setSortDir('desc') }
  }

  const sorted = [...proposals].sort((a, b) => {
    const aVal = a[sortField] ?? 0, bVal = b[sortField] ?? 0
    if (typeof aVal === 'string') return sortDir === 'desc' ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal)
    return sortDir === 'desc' ? bVal - aVal : aVal - bVal
  })

  // Empty state
  if (!loading && proposals.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm" style={{ color: 'var(--stone)' }}>No proposals recorded yet</p>
        <button onClick={onLoadSample} className="btn-primary mt-4">Load Sample Data</button>
      </div>
    )
  }

  // Loading skeleton
  if (loading && proposals.length === 0) {
    return (
      <div>
        <div className="register">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="register-row">
              <div className="h-3 w-24 shimmer" style={{ background: 'var(--rule)' }} />
              <div className="flex-1" />
              <div className="h-3 w-16 shimmer" style={{ background: 'var(--rule)' }} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const SortHeader = ({ field, label, align = 'left' }) => (
    <th className="px-3 py-2 cursor-pointer select-none"
      style={{ color: 'var(--stone)', fontSize: '0.625rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: align }}
      onClick={() => handleSort(field)}>
      {label} {sortField === field ? (sortDir === 'desc' ? '↓' : '↑') : ''}
    </th>
  )

  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="section-label">{proposals.length} {proposals.length === 1 ? 'Entry' : 'Entries'}</h2>
        <span className="text-[10px]" style={{ color: 'var(--stone)' }}>Click column to sort</span>
      </div>

      {/* Desktop register */}
      <div className="hidden md:block register">
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--rule)' }}>
              <SortHeader field="ngo_name" label="NGO" />
              <SortHeader field="title" label="Project" />
              <SortHeader field="sector" label="Sector" />
              <SortHeader field="region" label="Region" />
              <SortHeader field="beneficiaries" label="Beneficiaries" align="right" />
              <SortHeader field="requested_amount" label="Amount" align="right" />
              <SortHeader field="final_score" label="Score" align="right" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((p, i) => (
              <tr key={p.id || i} className="register-row" style={p.is_funded ? { background: 'rgba(156,107,48,0.04)' } : {}}>
                <td className="text-sm font-medium" style={{ color: 'var(--ink)', minWidth: '120px' }}>{p.ngo_name}</td>
                <td className="text-xs" style={{ color: 'var(--stone)', maxWidth: '180px' }} title={p.title}>
                  {p.title}
                </td>
                <td className="text-xs" style={{ color: 'var(--stone)' }}>{p.sector}</td>
                <td className="text-xs" style={{ color: 'var(--stone)' }}>{p.region}</td>
                <td className="text-xs text-right tabular" style={{ color: 'var(--ink)' }}>
                  {p.beneficiaries?.toLocaleString('en-IN') || '—'}
                </td>
                <td className="text-right">
                  <span className="font-serif text-sm tabular" style={{ color: 'var(--ink)' }}>
                    {formatCurrency(p.requested_amount)}
                  </span>
                </td>
                <td className="text-right"><ScoreBar score={p.final_score} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile register */}
      <div className="md:hidden register">
        {sorted.map((p, i) => (
          <div key={p.id || i} className="register-row flex-col items-start gap-1" style={p.is_funded ? { background: 'rgba(156,107,48,0.04)' } : {}}>
            <div className="flex items-center justify-between w-full">
              <span className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{p.ngo_name}</span>
              <ScoreBar score={p.final_score} />
            </div>
            <div className="flex items-center gap-2 w-full">
              <span className="text-[10px]" style={{ color: 'var(--stone)' }}>{p.title}</span>
              <span className="flex-1" />
              <span className="font-serif text-xs tabular" style={{ color: 'var(--ink)' }}>{formatCurrency(p.requested_amount)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
