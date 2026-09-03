import { useMemo } from 'react'

function formatCurrency(amount) {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`
  return `₹${amount.toLocaleString('en-IN')}`
}

function ScoreBadge({ score }) {
  const color = score >= 80 ? 'bg-emerald-100 text-emerald-700' :
                score >= 60 ? 'bg-blue-100 text-blue-700' :
                score >= 40 ? 'bg-amber-100 text-amber-700' :
                'bg-red-100 text-red-700'
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-bold ${color}`}>
      {score.toFixed(1)}
    </span>
  )
}

export default function ResultsView({ result, proposals, budget }) {
  const proposalMap = useMemo(() => {
    const map = {}
    proposals.forEach(p => { map[p.id] = p })
    return map
  }, [proposals])

  // Build funded/rejected from result
  const funded = useMemo(() => {
    if (!result?.funded) return []
    return result.funded
      .map(id => proposalMap[id])
      .filter(Boolean)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
  }, [result, proposalMap])

  const rejected = useMemo(() => {
    if (!result?.rejected) return []
    return result.rejected
      .map(id => proposalMap[id])
      .filter(Boolean)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
  }, [result, proposalMap])

  const totalFunded = result?.total_funded || funded.reduce((s, p) => s + (p.requested_amount || 0), 0)
  const utilizationPct = budget > 0 ? (totalFunded / budget) * 100 : 0

  // Proof moment: find a funded proposal with lower score than a rejected one
  const proofMoment = useMemo(() => {
    if (funded.length === 0 || rejected.length === 0) return null

    // Find the lowest-scored funded proposal
    const lowestFunded = funded.reduce((min, p) => (p.score || 0) < (min.score || 0) ? p : min, funded[0])

    // Find rejected proposals with higher scores
    const higherRejected = rejected.filter(p => (p.score || 0) > (lowestFunded.score || 0))
    if (higherRejected.length === 0) return null

    // Pick the highest-scored rejected proposal that's still unfunded
    const highestRejected = higherRejected.reduce((max, p) => (p.score || 0) > (max.score || 0) ? p : max, higherRejected[0])

    return { funded: lowestFunded, rejected: highestRejected }
  }, [funded, rejected])

  // Region/sector breakdown for summary
  const regionBreakdown = useMemo(() => {
    const map = {}
    funded.forEach(p => {
      map[p.region] = (map[p.region] || 0) + (p.requested_amount || 0)
    })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [funded])

  const sectorBreakdown = useMemo(() => {
    const map = {}
    funded.forEach(p => {
      map[p.sector] = (map[p.sector] || 0) + (p.requested_amount || 0)
    })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [funded])

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Funded</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(totalFunded)}</p>
          <p className="text-xs text-slate-400 mt-1">{funded.length} proposals</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Budget Used</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{utilizationPct.toFixed(1)}%</p>
          <p className="text-xs text-slate-400 mt-1">{formatCurrency(budget - totalFunded)} remaining</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Regions Covered</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{regionBreakdown.length}</p>
          <p className="text-xs text-slate-400 mt-1">of {new Set(proposals.map(p => p.region)).size} total</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Sectors Covered</p>
          <p className="text-2xl font-bold text-violet-600 mt-1">{sectorBreakdown.length}</p>
          <p className="text-xs text-slate-400 mt-1">of {new Set(proposals.map(p => p.sector)).size} total</p>
        </div>
      </div>

      {/* Budget Utilization Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Budget Utilization</h3>
        <div className="relative">
          <div className="h-8 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-1000 ease-out relative"
              style={{ width: `${Math.min(utilizationPct, 100)}%` }}
            >
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-white">
                {utilizationPct > 15 && formatCurrency(totalFunded)}
              </span>
            </div>
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-500">
            <span className="font-medium">{formatCurrency(totalFunded)} allocated</span>
            <span>{formatCurrency(budget)} total budget</span>
          </div>
        </div>
      </div>

      {/* Proof Moment — THE differentiator visual */}
      {proofMoment && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-amber-800 mb-1">Proof: Optimization, Not Sorting</h3>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-3">
                {/* Funded despite lower score */}
                <div className="flex items-center gap-3 bg-white/80 rounded-xl px-4 py-2.5 border border-amber-200">
                  <div className="text-center">
                    <p className="text-[10px] text-slate-400 uppercase font-medium">Funded</p>
                    <p className="text-sm font-bold text-emerald-700">{proofMoment.funded.ngo_name}</p>
                    <ScoreBadge score={proofMoment.funded.score || 0} />
                  </div>
                  <svg className="w-6 h-6 text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  <div className="text-center">
                    <p className="text-[10px] text-slate-400 uppercase font-medium">Rejected</p>
                    <p className="text-sm font-bold text-red-700">{proofMoment.rejected.ngo_name}</p>
                    <ScoreBadge score={proofMoment.rejected.score || 0} />
                  </div>
                </div>
                <span className="text-xs text-amber-700 font-medium bg-amber-100 px-3 py-1 rounded-full">
                  Lower score funded — better budget fit under constraints
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Two-column Funded / Rejected */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funded */}
        <div className="bg-white rounded-2xl border border-emerald-200/60 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-emerald-50/80 border-b border-emerald-100 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <h3 className="text-sm font-semibold text-emerald-700">
              Funded ({funded.length})
            </h3>
            <span className="ml-auto text-xs text-emerald-600 font-medium">
              {formatCurrency(totalFunded)}
            </span>
          </div>
          <div className="divide-y divide-slate-50 max-h-96 overflow-y-auto">
            {funded.map((p, i) => (
              <div key={p.id || i} className="px-5 py-3 hover:bg-emerald-50/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{p.ngo_name}</p>
                    <p className="text-xs text-slate-400">{p.sector} · {p.region}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-700">{formatCurrency(p.requested_amount)}</p>
                    <ScoreBadge score={p.score || 0} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rejected */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-slate-400" />
            <h3 className="text-sm font-semibold text-slate-500">
              Not Funded ({rejected.length})
            </h3>
            <span className="ml-auto text-xs text-slate-400 font-medium">
              {formatCurrency(rejected.reduce((s, p) => s + (p.requested_amount || 0), 0))}
            </span>
          </div>
          <div className="divide-y divide-slate-50 max-h-96 overflow-y-auto">
            {rejected.map((p, i) => (
              <div key={p.id || i} className="px-5 py-3 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">{p.ngo_name}</p>
                    <p className="text-xs text-slate-400">{p.sector} · {p.region}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-500">{formatCurrency(p.requested_amount)}</p>
                    <ScoreBadge score={p.score || 0} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
