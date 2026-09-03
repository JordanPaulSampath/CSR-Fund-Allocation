import { useState } from 'react'

const SECTOR_COLORS = {
  education: 'bg-blue-100 text-blue-700',
  health: 'bg-red-100 text-red-700',
  healthcare: 'bg-red-100 text-red-700',
  environment: 'bg-green-100 text-green-700',
  livelihood: 'bg-amber-100 text-amber-700',
  'water & sanitation': 'bg-cyan-100 text-cyan-700',
  'water and sanitation': 'bg-cyan-100 text-cyan-700',
  'women empowerment': 'bg-pink-100 text-pink-700',
  'rural development': 'bg-orange-100 text-orange-700',
  technology: 'bg-indigo-100 text-indigo-700',
  'community development': 'bg-purple-100 text-purple-700',
}

function formatCurrency(amount) {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`
  return `₹${amount.toLocaleString('en-IN')}`
}

function ScoreBadge({ score, size = 'sm' }) {
  const color = score >= 7 ? 'bg-emerald-100 text-emerald-700' :
                score >= 5 ? 'bg-blue-100 text-blue-700' :
                score >= 3 ? 'bg-amber-100 text-amber-700' :
                'bg-red-100 text-red-700'
  const sizeClass = size === 'lg' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs'
  return (
    <span className={`inline-flex items-center font-bold rounded-lg ${sizeClass} ${color}`}>
      {typeof score === 'number' ? score.toFixed(1) : '—'}
    </span>
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

  const SortIcon = ({ field }) => (
    <span className="ml-1 text-slate-300 text-[10px]">
      {sortField === field ? (sortDir === 'desc' ? '↓' : '↑') : '⇅'}
    </span>
  )

  // ── Empty state ──
  if (!loading && proposals.length === 0) {
    return (
      <div className="card p-8 sm:p-12 text-center">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 sm:w-8 sm:h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-slate-700 mb-1">No proposals yet</h3>
        <p className="text-sm text-slate-400 mb-5 max-w-sm mx-auto">Upload a CSV file or load sample data to start optimizing your CSR allocation</p>
        <button onClick={onLoadSample} className="btn-primary">Load Sample Data</button>
      </div>
    )
  }

  // ── Loading skeleton ──
  if (loading && proposals.length === 0) {
    return (
      <div className="card overflow-hidden">
        <div className="px-5 py-3 bg-slate-50/80 border-b border-slate-100">
          <div className="h-4 w-32 shimmer" />
        </div>
        <div className="p-5 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-4 w-32 shimmer" />
              <div className="h-4 w-20 shimmer" />
              <div className="h-4 w-24 shimmer hidden sm:block" />
              <div className="flex-1" />
              <div className="h-4 w-16 shimmer" />
              <div className="h-5 w-10 shimmer" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="card overflow-hidden">
      <div className="px-4 sm:px-5 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">
          {proposals.length} {proposals.length === 1 ? 'Proposal' : 'Proposals'}
        </h2>
        <span className="text-xs text-slate-400 hidden sm:inline">Click headers to sort</span>
      </div>

      {/* ── Desktop table ── */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100">
              {[
                { field: 'ngo_name', label: 'NGO', align: 'left' },
                { field: 'title', label: 'Project', align: 'left' },
                { field: 'sector', label: 'Sector', align: 'left' },
                { field: 'region', label: 'Region', align: 'left' },
                { field: 'requested_amount', label: 'Amount', align: 'right' },
                { field: 'beneficiaries', label: 'Beneficiaries', align: 'right' },
                { field: 'final_score', label: 'Score', align: 'right' },
              ].map(col => (
                <th key={col.field}
                  className={`px-4 py-3 text-${col.align} text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-600 select-none transition-colors`}
                  onClick={() => handleSort(col.field)}>
                  {col.label} <SortIcon field={col.field} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {sorted.map((p, i) => (
              <tr key={p.id || i} className={`hover:bg-blue-50/30 transition-colors duration-150 ${
                p.is_funded ? 'bg-emerald-50/30' : ''
              }`}>
                <td className="px-4 py-3 text-sm font-medium text-slate-800">{p.ngo_name}</td>
                <td className="px-4 py-3 text-sm text-slate-600 max-w-[200px] truncate" title={p.title}>{p.title}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${SECTOR_COLORS[p.sector?.toLowerCase()] || 'bg-slate-100 text-slate-600'}`}>
                    {p.sector}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">{p.region}</td>
                <td className="px-4 py-3 text-sm font-semibold text-slate-800 text-right tabular-nums">
                  {formatCurrency(p.requested_amount)}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600 text-right tabular-nums">
                  {p.beneficiaries?.toLocaleString('en-IN') || '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  <ScoreBadge score={p.final_score} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Mobile cards ── */}
      <div className="md:hidden divide-y divide-slate-50">
        {sorted.map((p, i) => (
          <div key={p.id || i} className={`px-4 py-3.5 hover:bg-blue-50/20 transition-colors duration-150 ${
            p.is_funded ? 'bg-emerald-50/30' : ''
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800 truncate">{p.ngo_name}</p>
                <p className="text-xs text-slate-500 truncate mt-0.5">{p.title}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-medium ${SECTOR_COLORS[p.sector?.toLowerCase()] || 'bg-slate-100 text-slate-600'}`}>
                    {p.sector}
                  </span>
                  <span className="text-xs text-slate-400">·</span>
                  <span className="text-xs text-slate-500">{p.region}</span>
                  {p.beneficiaries > 0 && (
                    <>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs text-slate-500">{p.beneficiaries.toLocaleString('en-IN')} people</span>
                    </>
                  )}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-slate-800 tabular-nums">{formatCurrency(p.requested_amount)}</p>
                <div className="mt-1"><ScoreBadge score={p.final_score} /></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
