import { useMemo, useEffect, useState } from 'react'

function formatCurrency(amount) {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`
  return `₹${amount.toLocaleString('en-IN')}`
}

function ScoreBar({ score }) {
  const pct = Math.min((score / 10) * 100, 100)
  return (
    <div className="flex items-center gap-2">
      <div className="score-bar"><div className="score-bar-fill" style={{ width: `${pct}%` }} /></div>
      <span className="font-serif text-xs tabular" style={{ color: 'var(--ink)' }}>{score.toFixed(1)}</span>
    </div>
  )
}

function Seal({ delay = 0 }) {
  return (
    <div className="seal seal-filled animate-stamp" style={{ animationDelay: `${delay}ms` }}>
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </div>
  )
}

function EmptySeal() {
  return <div className="seal" style={{ borderColor: 'var(--rule)' }} />
}

export default function ResultsView({ result, proposals, budget }) {
  const [stamped, setStamped] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setStamped(true), 300)
    return () => clearTimeout(t)
  }, [])

  const funded = useMemo(() => (result?.funded || []).sort((a, b) => (b.final_score || 0) - (a.final_score || 0)), [result])
  const rejected = useMemo(() => (result?.rejected || []).sort((a, b) => (b.final_score || 0) - (a.final_score || 0)), [result])

  const totalFunded = result?.spent || funded.reduce((s, p) => s + (p.requested_amount || 0), 0)
  const totalBudget = result?.total_budget || budget
  const utilizationPct = totalBudget > 0 ? Math.min((totalFunded / totalBudget) * 100, 100) : 0

  // Proof moment
  const proofMoment = useMemo(() => {
    if (funded.length === 0 || rejected.length === 0) return null
    const lowestFunded = funded.reduce((min, p) => (p.final_score || 0) < (min.final_score || 0) ? p : min, funded[0])
    const higherRejected = rejected.filter(p => (p.final_score || 0) > (lowestFunded.final_score || 0))
    if (higherRejected.length === 0) return null
    const highestRejected = higherRejected.reduce((max, p) => (p.final_score || 0) > (max.final_score || 0) ? p : max, higherRejected[0])
    return { funded: lowestFunded, rejected: highestRejected }
  }, [funded, rejected])

  return (
    <div className="space-y-8 page-enter">

      {/* ── Hero statement ── */}
      <div className="text-center py-4">
        <p className="font-serif text-2xl sm:text-3xl animate-scale-in" style={{ color: 'var(--ink)', letterSpacing: '-0.01em' }}>
          {formatCurrency(totalFunded)} of {formatCurrency(totalBudget)} allocated
        </p>
        <p className="text-xs mt-2" style={{ color: 'var(--stone)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          across {funded.length} of {funded.length + rejected.length} proposals
        </p>
        {result?.solver && (
          <p className="text-[10px] mt-1" style={{ color: 'var(--stone)' }}>
            Solver: {result.solver}
          </p>
        )}
      </div>

      <hr className="rule" />

      {/* ── Budget utilization ── */}
      <div>
        <p className="section-label mb-2">Budget Utilization</p>
        <div className="h-2 rounded-sm overflow-hidden" style={{ background: 'var(--rule)' }}>
          <div className="h-full rounded-sm animate-fill-bar" style={{ width: `${utilizationPct}%`, background: 'var(--petrol)' }} />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="font-serif text-xs tabular" style={{ color: 'var(--ink)' }}>{formatCurrency(totalFunded)}</span>
          <span className="text-xs" style={{ color: 'var(--stone)' }}>{formatCurrency(totalBudget)}</span>
        </div>
      </div>

      {/* ── Proof moment ── */}
      {proofMoment && (
        <div className="p-5" style={{ background: 'var(--paper)', border: '1px solid var(--rule)' }}>
          <p className="section-label mb-3">Allocation Insight</p>
          <div className="flex flex-col sm:flex-row items-start gap-4">
            {/* Funded with seal */}
            <div className="flex-1 p-4" style={{ border: '1px solid var(--rule)' }}>
              <div className="flex items-center gap-2 mb-2">
                {stamped && <Seal delay={200} />}
                <span className="text-[10px] uppercase" style={{ color: 'var(--petrol)', letterSpacing: '0.08em', fontWeight: 600 }}>Funded</span>
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{proofMoment.funded.ngo_name}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--stone)' }}>{proofMoment.funded.title}</p>
              <div className="flex items-center gap-3 mt-2">
                <ScoreBar score={proofMoment.funded.final_score} />
                <span className="font-serif text-sm tabular" style={{ color: 'var(--ink)' }}>{formatCurrency(proofMoment.funded.requested_amount)}</span>
              </div>
            </div>

            {/* Rejected without seal */}
            <div className="flex-1 p-4" style={{ border: '1px solid var(--rule)', opacity: 0.7 }}>
              <div className="flex items-center gap-2 mb-2">
                <EmptySeal />
                <span className="text-[10px] uppercase" style={{ color: 'var(--stone)', letterSpacing: '0.08em', fontWeight: 600 }}>Not Funded</span>
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{proofMoment.rejected.ngo_name}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--stone)' }}>{proofMoment.rejected.title}</p>
              <div className="flex items-center gap-3 mt-2">
                <ScoreBar score={proofMoment.rejected.final_score} />
                <span className="font-serif text-sm tabular" style={{ color: 'var(--ink)' }}>{formatCurrency(proofMoment.rejected.requested_amount)}</span>
              </div>
            </div>
          </div>
          <p className="text-xs mt-3 italic" style={{ color: 'var(--stone)' }}>
            A lower-scored proposal was funded — it fit the budget better under constraints.
          </p>
        </div>
      )}

      <hr className="rule" />

      {/* ── Funded register ── */}
      <div>
        <div className="flex items-baseline justify-between mb-2">
          <p className="section-label">Funded — {funded.length} entries</p>
          <span className="font-serif text-xs tabular" style={{ color: 'var(--petrol)' }}>{formatCurrency(totalFunded)}</span>
        </div>
        <div className="register">
          {funded.map((p, i) => (
            <div key={p.id || i} className="register-row animate-slide-in-left" style={{ animationDelay: `${i * 40}ms` }}>
              {stamped && <Seal delay={300 + i * 80} />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{p.ngo_name}</p>
                <p className="text-[10px]" style={{ color: 'var(--stone)' }}>{p.title}</p>
              </div>
              <div className="text-right">
                <p className="font-serif text-sm tabular" style={{ color: 'var(--ink)' }}>{formatCurrency(p.requested_amount)}</p>
                <ScoreBar score={p.final_score} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Rejected register ── */}
      <div>
        <div className="flex items-baseline justify-between mb-2">
          <p className="section-label">Not Funded — {rejected.length} entries</p>
          <span className="text-xs" style={{ color: 'var(--stone)' }}>{formatCurrency(rejected.reduce((s, p) => s + (p.requested_amount || 0), 0))}</span>
        </div>
        <div className="register">
          {rejected.map((p, i) => (
            <div key={p.id || i} className="register-row" style={{ opacity: 0.7 }}>
              <EmptySeal />
              <div className="flex-1 min-w-0">
                <p className="text-sm" style={{ color: 'var(--ink)' }}>{p.ngo_name}</p>
                <p className="text-[10px]" style={{ color: 'var(--stone)' }}>{p.title}</p>
              </div>
              <div className="text-right">
                <p className="font-serif text-sm tabular" style={{ color: 'var(--ink)' }}>{formatCurrency(p.requested_amount)}</p>
                <ScoreBar score={p.final_score} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      {result?.notes?.length > 0 && (
        <div className="pt-4" style={{ borderTop: '1px solid var(--rule)' }}>
          <p className="section-label mb-2">Notes</p>
          {result.notes.map((note, i) => (
            <p key={i} className="text-xs" style={{ color: 'var(--stone)' }}>· {note}</p>
          ))}
        </div>
      )}
    </div>
  )
}
