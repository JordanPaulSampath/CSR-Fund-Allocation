import { useMemo, useEffect, useState } from 'react'

function formatCurrency(amount) {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`
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

export default function ResultsView({ result, proposals, budget }) {
  const [barWidth, setBarWidth] = useState(0)

  // Backend returns full ProposalOut objects directly
  const funded = useMemo(() => {
    return (result?.funded || []).sort((a, b) => (b.final_score || 0) - (a.final_score || 0))
  }, [result])

  const rejected = useMemo(() => {
    return (result?.rejected || []).sort((a, b) => (b.final_score || 0) - (a.final_score || 0))
  }, [result])

  const totalFunded = result?.spent || funded.reduce((s, p) => s + (p.requested_amount || 0), 0)
  const totalBudget = result?.total_budget || budget
  const utilizationPct = totalBudget > 0 ? Math.min((totalFunded / totalBudget) * 100, 100) : 0

  useEffect(() => {
    const t = setTimeout(() => setBarWidth(utilizationPct), 100)
    return () => clearTimeout(t)
  }, [utilizationPct])

  // Proof moment
  const proofMoment = useMemo(() => {
    if (funded.length === 0 || rejected.length === 0) return null
    const lowestFunded = funded.reduce((min, p) => (p.final_score || 0) < (min.final_score || 0) ? p : min, funded[0])
    const higherRejected = rejected.filter(p => (p.final_score || 0) > (lowestFunded.final_score || 0))
    if (higherRejected.length === 0) return null
    const highestRejected = higherRejected.reduce((max, p) => (p.final_score || 0) > (max.final_score || 0) ? p : max, higherRejected[0])
    return { funded: lowestFunded, rejected: highestRejected }
  }, [funded, rejected])

  const allProposals = [...funded, ...rejected]
  const totalRegions = new Set(allProposals.map(p => p.region)).size
  const totalSectors = new Set(allProposals.map(p => p.sector)).size
  const regionBreakdown = useMemo(() => {
    const map = {}
    funded.forEach(p => { map[p.region] = (map[p.region] || 0) + (p.requested_amount || 0) })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [funded])
  const sectorBreakdown = useMemo(() => {
    const map = {}
    funded.forEach(p => { map[p.sector] = (map[p.sector] || 0) + (p.requested_amount || 0) })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [funded])

  return (
    <div className="space-y-5 sm:space-y-6 animate-fade-in-up">

      {/* Solver info banner */}
      {result?.solver && (
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Solver: <strong>{result.solver}</strong></span>
          {result.strategy && <span className="text-blue-500">· Strategy: {result.strategy}</span>}
        </div>
      )}

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 stagger">
        {[
          { label: 'Total Funded', value: formatCurrency(totalFunded), sub: `${funded.length} proposals`, color: 'text-emerald-600' },
          { label: 'Budget Used', value: `${utilizationPct.toFixed(1)}%`, sub: `${formatCurrency(totalBudget - totalFunded)} remaining`, color: 'text-blue-600' },
          { label: 'Beneficiaries', value: (result?.total_beneficiaries || 0).toLocaleString('en-IN'), sub: 'people impacted', color: 'text-indigo-600' },
          { label: 'Total Score', value: (result?.total_score || 0).toFixed(1), sub: 'weighted impact', color: 'text-violet-600' },
        ].map(card => (
          <div key={card.label} className="card p-4 sm:p-5 hover-lift">
            <p className="label text-[10px] sm:text-xs">{card.label}</p>
            <p className={`text-xl sm:text-2xl font-bold mt-1 ${card.color}`}>{card.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Budget Utilization Bar ── */}
      <div className="card p-5 sm:p-6">
        <h3 className="section-title mb-3">Budget Utilization</h3>
        <div className="relative">
          <div className="h-7 sm:h-8 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-[1200ms] ease-out relative animate-budget-fill"
              style={{ width: `${barWidth}%` }}>
              {barWidth > 18 && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-white drop-shadow-sm">
                  {formatCurrency(totalFunded)}
                </span>
              )}
            </div>
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-500">
            <span className="font-medium">{formatCurrency(totalFunded)} allocated</span>
            <span>{formatCurrency(totalBudget)} budget</span>
          </div>
        </div>
      </div>

      {/* ── Optimization Insight ── */}
      {proofMoment && (
        <div className="relative overflow-hidden rounded-2xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 p-5 sm:p-7 animate-fade-in-up">
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 animate-float" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" />
            </svg>
          </div>
          <div className="relative">
            <p className="label text-amber-600 text-[10px] sm:text-xs mb-2">✦ Optimization Insight</p>
            <h3 className="text-base sm:text-lg font-bold text-amber-900 mb-1">
              The optimizer didn't simply pick the highest scores
            </h3>
            <p className="text-xs sm:text-sm text-amber-700/70 mb-5">It considers budget fit and constraints, not score alone.</p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <div className="flex-1 bg-white rounded-xl border border-emerald-200 p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                    <svg className="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">Funded</span>
                </div>
                <p className="text-sm font-bold text-slate-800">{proofMoment.funded.ngo_name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{proofMoment.funded.title}</p>
                <div className="flex items-center gap-2 mt-2">
                  <ScoreBadge score={proofMoment.funded.final_score} size="lg" />
                  <span className="text-sm font-semibold text-slate-600 tabular-nums">{formatCurrency(proofMoment.funded.requested_amount)}</span>
                </div>
                <p className="text-[11px] text-emerald-600 font-medium mt-2 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Better fit under constraints
                </p>
              </div>

              <div className="hidden sm:flex flex-col items-center gap-1">
                <div className="w-px h-6 bg-amber-200" />
                <span className="text-xs font-bold text-amber-400">vs</span>
                <div className="w-px h-6 bg-amber-200" />
              </div>
              <div className="sm:hidden flex items-center gap-3 justify-center">
                <div className="flex-1 h-px bg-amber-200" />
                <span className="text-xs font-bold text-amber-400">vs</span>
                <div className="flex-1 h-px bg-amber-200" />
              </div>

              <div className="flex-1 bg-white rounded-xl border border-slate-200 p-4 shadow-sm opacity-75">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                    <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Not Funded</span>
                </div>
                <p className="text-sm font-bold text-slate-700">{proofMoment.rejected.ngo_name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{proofMoment.rejected.title}</p>
                <div className="flex items-center gap-2 mt-2">
                  <ScoreBadge score={proofMoment.rejected.final_score} size="lg" />
                  <span className="text-sm font-semibold text-slate-500 tabular-nums">{formatCurrency(proofMoment.rejected.requested_amount)}</span>
                </div>
                <p className="text-[11px] text-red-500 font-medium mt-2 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  Higher score but exceeded constraints
                </p>
              </div>
            </div>
            <p className="text-xs text-amber-600/60 mt-4 text-center italic">"The optimizer considers budget and constraints, not score alone."</p>
          </div>
        </div>
      )}

      {/* ── Two-column Funded / Rejected ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        <div className="card overflow-hidden border-emerald-200/60">
          <div className="px-4 sm:px-5 py-3 bg-emerald-50/80 border-b border-emerald-100 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <h3 className="text-sm font-semibold text-emerald-700">Funded ({funded.length})</h3>
            <span className="ml-auto text-xs text-emerald-600 font-medium">{formatCurrency(totalFunded)}</span>
          </div>
          <div className="divide-y divide-slate-50 max-h-80 sm:max-h-96 overflow-y-auto">
            {funded.map((p, i) => (
              <div key={p.id || i} className="px-4 sm:px-5 py-3 hover:bg-emerald-50/30 transition-colors duration-150">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{p.ngo_name}</p>
                    <p className="text-xs text-slate-400 truncate">{p.title}</p>
                    <p className="text-[10px] text-slate-400">{p.sector} · {p.region} · {p.beneficiaries?.toLocaleString()} people</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-emerald-700 tabular-nums">{formatCurrency(p.requested_amount)}</p>
                    <ScoreBadge score={p.final_score} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="px-4 sm:px-5 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-slate-400" />
            <h3 className="text-sm font-semibold text-slate-500">Not Funded ({rejected.length})</h3>
            <span className="ml-auto text-xs text-slate-400 font-medium">
              {formatCurrency(rejected.reduce((s, p) => s + (p.requested_amount || 0), 0))}
            </span>
          </div>
          <div className="divide-y divide-slate-50 max-h-80 sm:max-h-96 overflow-y-auto">
            {rejected.map((p, i) => (
              <div key={p.id || i} className="px-4 sm:px-5 py-3 hover:bg-slate-50/50 transition-colors duration-150">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-600 truncate">{p.ngo_name}</p>
                    <p className="text-xs text-slate-400 truncate">{p.title}</p>
                    <p className="text-[10px] text-slate-400">{p.sector} · {p.region}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-slate-500 tabular-nums">{formatCurrency(p.requested_amount)}</p>
                    <ScoreBadge score={p.final_score} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Backend notes */}
      {result?.notes?.length > 0 && (
        <div className="card p-4 sm:p-5">
          <h3 className="section-title mb-2">Allocation Notes</h3>
          <ul className="space-y-1">
            {result.notes.map((note, i) => (
              <li key={i} className="text-xs text-slate-500 flex items-start gap-2">
                <span className="text-slate-300 mt-0.5">•</span> {note}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
