import { useState } from 'react'

const SECTOR_COLORS = {
  Education: 'bg-blue-100 text-blue-700',
  Healthcare: 'bg-red-100 text-red-700',
  Environment: 'bg-green-100 text-green-700',
  Livelihood: 'bg-amber-100 text-amber-700',
  'Water & Sanitation': 'bg-cyan-100 text-cyan-700',
  'Women Empowerment': 'bg-pink-100 text-pink-700',
  'Rural Development': 'bg-orange-100 text-orange-700',
  Technology: 'bg-indigo-100 text-indigo-700',
  'Community Development': 'bg-purple-100 text-purple-700',
}

function formatCurrency(amount) {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`
  return `₹${amount.toLocaleString('en-IN')}`
}

function ScoreBadge({ score }) {
  const color = score >= 80 ? 'bg-emerald-100 text-emerald-700' :
                score >= 60 ? 'bg-blue-100 text-blue-700' :
                score >= 40 ? 'bg-amber-100 text-amber-700' :
                'bg-red-100 text-red-700'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold ${color}`}>
      {score.toFixed(1)}
    </span>
  )
}

export default function ProposalList({ proposals, loading, onLoadSample }) {
  const [sortField, setSortField] = useState('score')
  const [sortDir, setSortDir] = useState('desc')

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  const sorted = [...proposals].sort((a, b) => {
    const aVal = a[sortField] ?? 0
    const bVal = b[sortField] ?? 0
    return sortDir === 'desc' ? bVal - aVal : aVal - bVal
  })

  const SortIcon = ({ field }) => (
    <span className="ml-1 text-slate-300">
      {sortField === field ? (sortDir === 'desc' ? '↓' : '↑') : '⇅'}
    </span>
  )

  // Empty state
  if (!loading && proposals.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-slate-700 mb-1">No proposals yet</h3>
        <p className="text-sm text-slate-400 mb-5">Upload a CSV file or load sample data to get started</p>
        <button
          onClick={onLoadSample}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 transition-all shadow-md hover:shadow-lg"
        >
          Load Sample Data
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
      {/* Table header */}
      <div className="px-5 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">
          {proposals.length} {proposals.length === 1 ? 'Proposal' : 'Proposals'}
        </h2>
        <span className="text-xs text-slate-400">Click column headers to sort</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-600 select-none"
                onClick={() => handleSort('ngo_name')}>
                NGO Name <SortIcon field="ngo_name" />
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-600 select-none"
                onClick={() => handleSort('sector')}>
                Sector <SortIcon field="sector" />
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-600 select-none"
                onClick={() => handleSort('region')}>
                Region <SortIcon field="region" />
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-600 select-none"
                onClick={() => handleSort('requested_amount')}>
                Amount <SortIcon field="requested_amount" />
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-600 select-none"
                onClick={() => handleSort('score')}>
                Score <SortIcon field="score" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={`skel-${i}`}>
                  <td className="px-5 py-3"><div className="h-4 w-32 rounded bg-slate-100 shimmer" /></td>
                  <td className="px-5 py-3"><div className="h-4 w-20 rounded bg-slate-100 shimmer" /></td>
                  <td className="px-5 py-3"><div className="h-4 w-24 rounded bg-slate-100 shimmer" /></td>
                  <td className="px-5 py-3"><div className="h-4 w-16 rounded bg-slate-100 shimmer ml-auto" /></td>
                  <td className="px-5 py-3"><div className="h-4 w-10 rounded bg-slate-100 shimmer ml-auto" /></td>
                </tr>
              ))
            ) : (
              sorted.map((p, i) => (
                <tr key={p.id || i} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-5 py-3">
                    <span className="text-sm font-medium text-slate-800">{p.ngo_name}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${SECTOR_COLORS[p.sector] || 'bg-slate-100 text-slate-600'}`}>
                      {p.sector}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-600">{p.region}</td>
                  <td className="px-5 py-3 text-sm font-semibold text-slate-800 text-right tabular-nums">
                    {formatCurrency(p.requested_amount)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <ScoreBadge score={p.score || 0} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
