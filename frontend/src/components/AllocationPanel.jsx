import { useState, useEffect } from 'react'

export default function AllocationPanel({ budget, constraints, setConstraints, onAllocate, onCompare, allocating, proposalCount }) {
  const [step, setStep] = useState(-1)
  const [tickEvaluated, setTickEvaluated] = useState(0)
  const [tickBudget, setTickBudget] = useState(budget)
  const [showConstraints, setShowConstraints] = useState(false)

  const formatBudget = (v) => {
    if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)} Cr`
    if (v >= 100000) return `₹${(v / 100000).toFixed(1)} L`
    return `₹${v.toLocaleString('en-IN')}`
  }

  useEffect(() => {
    if (!allocating) { setStep(-1); setTickEvaluated(0); setTickBudget(budget); return }
    setStep(0); setTickEvaluated(0); setTickBudget(budget)

    // Simulate ticking numbers
    let count = 0
    const interval = setInterval(() => {
      count++
      setTickEvaluated(Math.min(count * 3, proposalCount))
      setTickBudget(Math.max(budget - count * 12000, budget * 0.15))
      if (count >= proposalCount / 3) clearInterval(interval)
    }, 100)

    const t1 = setTimeout(() => setStep(1), 600)
    const t2 = setTimeout(() => setStep(2), 1200)
    const t3 = setTimeout(() => { setStep(3); clearInterval(interval) }, 1800)
    return () => { clearInterval(interval); clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [allocating, proposalCount, budget])

  // Allocating state
  if (allocating) {
    const steps = [
      { label: 'Evaluating proposals', done: step >= 1 },
      { label: 'Applying constraints', done: step >= 2 },
      { label: 'Solving allocation', done: step >= 3 },
    ]
    return (
      <div className="p-5" style={{ background: 'var(--paper)', border: '1px solid var(--rule)' }}>
        <p className="section-label mb-4">Optimizing</p>

        {/* Ticking numbers */}
        <div className="flex items-baseline gap-6 mb-5">
          <div>
            <p className="font-serif text-2xl tabular animate-tick" style={{ color: 'var(--ink)' }}>
              {tickEvaluated}
            </p>
            <p className="text-[10px] uppercase" style={{ color: 'var(--stone)', letterSpacing: '0.08em' }}>evaluated</p>
          </div>
          <div>
            <p className="font-serif text-2xl tabular animate-tick" style={{ color: 'var(--ink)' }}>
              {formatBudget(tickBudget)}
            </p>
            <p className="text-[10px] uppercase" style={{ color: 'var(--stone)', letterSpacing: '0.08em' }}>remaining</p>
          </div>
        </div>

        {/* Step checklist */}
        <div className="space-y-2">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2 text-xs animate-slide-in-left" style={{ color: s.done ? 'var(--petrol)' : 'var(--stone)', animationDelay: `${i * 100}ms` }}>
              <span style={{ width: '14px', textAlign: 'center' }}>
                {s.done ? '✓' : (i === step ? <span className="inline-block w-2 h-2 rounded-full animate-pulse-dot" style={{ background: 'var(--petrol)' }} /> : '○')}
              </span>
              <span style={{ textDecoration: s.done ? 'line-through' : 'none', opacity: s.done ? 0.6 : 1 }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-5" style={{ background: 'var(--paper)', border: '1px solid var(--rule)' }}>
      <div className="flex items-baseline justify-between mb-4">
        <p className="section-label">Allocate Funds</p>
        <button onClick={() => setShowConstraints(!showConstraints)} className="btn-ghost text-[10px]">
          {showConstraints ? 'Hide' : 'Constraints'}
        </button>
      </div>

      {showConstraints && (
        <div className="mb-4 p-3 space-y-3 animate-scale-in" style={{ background: 'var(--parchment)', border: '1px solid var(--rule)' }}>
          {[
            { key: 'min_regions', label: 'Min regions', min: 1, max: 10 },
            { key: 'min_sectors', label: 'Min sectors', min: 1, max: 10 },
            { key: 'max_per_region_ratio', label: 'Max per region %', min: 10, max: 100, step: 5, isPercent: true },
          ].map(c => (
            <div key={c.key}>
              <label className="section-label block mb-1">{c.label}</label>
              <input type="number" min={c.min} max={c.max} step={c.step || 1}
                value={c.isPercent ? Math.round(constraints[c.key] * 100) : constraints[c.key]}
                onChange={e => setConstraints(prev => ({
                  ...prev, [c.key]: c.isPercent ? parseInt(e.target.value) / 100 || 0.5 : parseInt(e.target.value) || 1
                }))} className="input" style={{ width: '80px' }} />
            </div>
          ))}
        </div>
      )}

      <button onClick={() => onAllocate('optimizer')} disabled={allocating || proposalCount === 0}
        className="btn-primary w-full">
        Run Allocation — {formatBudget(budget)}
      </button>

      {onCompare && (
        <button onClick={onCompare} disabled={allocating || proposalCount === 0}
          className="btn-secondary w-full mt-2">
          Compare: Optimizer vs Ranked
        </button>
      )}
    </div>
  )
}
