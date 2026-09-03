import { useState, useEffect } from 'react'

const STEP_LABELS = [
  { key: 'scoring', label: 'Scoring proposals', icon: '✓' },
  { key: 'constraints', label: 'Applying constraints', icon: '✓' },
  { key: 'solving', label: 'Finding optimal allocation', icon: '◉' },
  { key: 'finalizing', label: 'Finalizing results', icon: '○' },
]

export default function AllocationPanel({ budget, constraints, setConstraints, onAllocate, allocating, proposalCount }) {
  const [step, setStep] = useState(-1)
  const [complete, setComplete] = useState(false)
  const [showConstraints, setShowConstraints] = useState(false)

  const formatBudget = (v) => {
    if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)} Cr`
    if (v >= 100000) return `₹${(v / 100000).toFixed(1)} L`
    return `₹${v.toLocaleString('en-IN')}`
  }

  useEffect(() => {
    if (!allocating) {
      if (step >= 3) {
        setComplete(true)
        setTimeout(() => { setComplete(false); setStep(-1) }, 2500)
      } else {
        setStep(-1)
      }
      return
    }
    setComplete(false)
    setStep(0)
    const t1 = setTimeout(() => setStep(1), 800)
    const t2 = setTimeout(() => setStep(2), 1600)
    const t3 = setTimeout(() => setStep(3), 2400)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [allocating])

  // ── Completing state ──
  if (complete) {
    return (
      <div className="card border-emerald-200 bg-emerald-50/50 p-6 sm:p-8 text-center animate-fade-in-scale">
        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-base font-bold text-emerald-800">Allocation Complete</h3>
      </div>
    )
  }

  // ── Allocating state ──
  if (allocating) {
    return (
      <div className="card border-blue-200 shadow-md p-6 sm:p-8 animate-fade-in-up">
        <div className="flex flex-col items-center text-center">
          {/* Animated spinner */}
          <div className="relative w-14 h-14 mb-4">
            <div className="absolute inset-0 rounded-full border-[3px] border-blue-100" />
            <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-blue-600 animate-spin" />
            <div className="absolute inset-2.5 rounded-full bg-blue-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>

          <h3 className="text-base font-bold text-slate-800 mb-1">Optimizing CSR allocation</h3>
          <p className="text-sm text-slate-500 mb-5">
            {proposalCount} proposals · {formatBudget(budget)} budget
          </p>

          {/* Step checklist */}
          <div className="w-full max-w-xs space-y-2">
            {STEP_LABELS.map((s, i) => {
              const state = i < step ? 'done' : i === step ? 'active' : 'pending'
              return (
                <div key={s.key} className={`flex items-center gap-2.5 text-sm transition-all duration-300 ${
                  state === 'done' ? 'text-emerald-600' :
                  state === 'active' ? 'text-blue-600 font-medium' :
                  'text-slate-300'
                }`}>
                  {state === 'done' ? (
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path className="animate-check" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : state === 'active' ? (
                    <div className="w-4 h-4 flex-shrink-0 border-2 border-blue-400 rounded-full border-t-transparent animate-spin" />
                  ) : (
                    <div className="w-4 h-4 flex-shrink-0 border-2 border-slate-200 rounded-full" />
                  )}
                  <span>{s.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // ── Idle state ──
  return (
    <div className="card p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h2 className="section-title">Run Allocation</h2>
          <p className="section-subtitle mt-0.5">
            Optimize fund distribution across {proposalCount} proposals
          </p>
        </div>
        <button
          onClick={() => setShowConstraints(!showConstraints)}
          className="btn-ghost text-xs self-start"
        >
          {showConstraints ? 'Hide' : 'Configure'} constraints
          <svg className={`w-3 h-3 ml-1 inline transition-transform duration-200 ${showConstraints ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Constraints */}
      {showConstraints && (
        <div className="mb-5 p-4 bg-slate-50 rounded-xl space-y-3 animate-fade-in-up">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { key: 'min_regions', label: 'Min regions', min: 1, max: 10 },
              { key: 'min_sectors', label: 'Min sectors', min: 1, max: 10 },
              { key: 'max_per_region_ratio', label: 'Max per region %', min: 10, max: 100, step: 5, isPercent: true },
            ].map(c => (
              <div key={c.key}>
                <label className="label block mb-1">{c.label}</label>
                <input
                  type="number"
                  min={c.min} max={c.max} step={c.step || 1}
                  value={c.isPercent ? Math.round(constraints[c.key] * 100) : constraints[c.key]}
                  onChange={e => setConstraints(prev => ({
                    ...prev,
                    [c.key]: c.isPercent ? parseInt(e.target.value) / 100 || 0.5 : parseInt(e.target.value) || 1
                  }))}
                  className="input input-sm"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onAllocate}
        disabled={allocating || proposalCount === 0}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Run Allocation — {formatBudget(budget)}
      </button>
    </div>
  )
}
