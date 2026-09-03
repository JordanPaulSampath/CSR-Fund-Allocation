import { useState, useEffect } from 'react'

export default function AllocationPanel({ budget, constraints, setConstraints, onAllocate, allocating, proposalCount }) {
  const [step, setStep] = useState(0) // 0=idle, 1=optimizing, 2=almost
  const [showConstraints, setShowConstraints] = useState(false)

  // Simulate multi-step loading for demo wow factor
  useEffect(() => {
    if (!allocating) {
      setStep(0)
      return
    }
    setStep(1)
    const t1 = setTimeout(() => setStep(2), 1200)
    const t2 = setTimeout(() => setStep(3), 2400)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [allocating])

  const formatBudget = (v) => {
    if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)} Cr`
    if (v >= 100000) return `₹${(v / 100000).toFixed(1)} L`
    return `₹${v.toLocaleString('en-IN')}`
  }

  if (allocating) {
    return (
      <div className="bg-white rounded-2xl border border-blue-200 shadow-lg p-8 text-center animate-fade-in-up">
        <div className="relative w-16 h-16 mx-auto mb-5">
          {/* Spinning ring */}
          <div className="absolute inset-0 rounded-full border-4 border-blue-100" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 animate-spin" />
          {/* Inner icon */}
          <div className="absolute inset-2 rounded-full bg-blue-50 flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </div>

        <h3 className="text-lg font-bold text-slate-800 mb-2">
          {step < 2 ? 'Analyzing proposals…' : 'Optimizing allocation…'}
        </h3>
        <p className="text-sm text-slate-500 mb-4">
          Running ILP solver on {proposalCount} proposals against {formatBudget(budget)} budget
        </p>

        {/* Progress steps */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
          <span className={`flex items-center gap-1 ${step >= 1 ? 'text-blue-600 font-medium' : ''}`}>
            {step >= 1 ? '✓' : '○'} Scoring
          </span>
          <span>→</span>
          <span className={`flex items-center gap-1 ${step >= 2 ? 'text-blue-600 font-medium' : ''}`}>
            {step >= 2 ? '✓' : '○'} Constraints
          </span>
          <span>→</span>
          <span className={`flex items-center gap-1 ${step >= 3 ? 'text-blue-600 font-medium' : ''}`}>
            {step >= 3 ? '✓' : '○'} Solving
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-slate-800">Run Allocation</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Optimize fund distribution across {proposalCount} proposals
          </p>
        </div>
        <button
          onClick={() => setShowConstraints(!showConstraints)}
          className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          {showConstraints ? 'Hide' : 'Configure'} constraints
        </button>
      </div>

      {/* Constraints (collapsible) */}
      {showConstraints && (
        <div className="mb-4 p-4 bg-slate-50 rounded-xl space-y-3 animate-fade-in-up">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Min regions</label>
              <input
                type="number" min={1} max={10}
                value={constraints.min_regions}
                onChange={e => setConstraints(c => ({ ...c, min_regions: parseInt(e.target.value) || 1 }))}
                className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Min sectors</label>
              <input
                type="number" min={1} max={10}
                value={constraints.min_sectors}
                onChange={e => setConstraints(c => ({ ...c, min_sectors: parseInt(e.target.value) || 1 }))}
                className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Max per region %</label>
              <input
                type="number" min={10} max={100} step={5}
                value={Math.round(constraints.max_per_region_ratio * 100)}
                onChange={e => setConstraints(c => ({ ...c, max_per_region_ratio: parseInt(e.target.value) / 100 || 0.5 }))}
                className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </div>
          </div>
        </div>
      )}

      {/* Main button */}
      <button
        onClick={onAllocate}
        disabled={allocating || proposalCount === 0}
        className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-sm hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Run Allocation — {formatBudget(budget)}
      </button>
    </div>
  )
}
