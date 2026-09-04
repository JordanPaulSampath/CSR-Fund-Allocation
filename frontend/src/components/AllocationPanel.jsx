import { useState, useEffect } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { spring } from '../lib/motion'
import SpringNumber from './SpringNumber'

const fmt = (v) => {
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)} Cr`
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)} L`
  return `₹${Math.round(v).toLocaleString('en-IN')}`
}

const STAGES = ['Reading proposals', 'Scoring impact & cost', 'Searching fund combinations', 'Locking the optimal set']

export default function AllocationPanel({ budget, constraints, setConstraints, onAllocate, onCompare, allocating, proposalCount }) {
  const reduce = useReducedMotion()
  const [showConstraints, setShowConstraints] = useState(false)
  const [equityOn, setEquityOn] = useState(false)
  const [stage, setStage] = useState(0)
  const [scanned, setScanned] = useState(0)

  useEffect(() => {
    if (!allocating) { setStage(0); setScanned(0); return }
    const timers = STAGES.map((_, i) => setTimeout(() => setStage(i), i * 520))
    let n = 0
    const iv = setInterval(() => {
      n += Math.max(1, Math.round(proposalCount / 24))
      setScanned(Math.min(n, proposalCount))
      if (n >= proposalCount) clearInterval(iv)
    }, 70)
    return () => { timers.forEach(clearTimeout); clearInterval(iv) }
  }, [allocating, proposalCount])

  // ── L3: the optimisation is the dramatic moment ──
  if (allocating) {
    return (
      <motion.div className="card p-5 glow-pulse"
        initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={spring.ui}>
        <p className="section-label mb-4">Optimising</p>

        <div className="flex items-baseline gap-6 mb-4">
          <div>
            <p className="font-serif text-2xl tabular" style={{ color: 'var(--ink)' }}>
              <SpringNumber value={scanned} format={(n) => Math.round(n).toString()} level="micro" />
            </p>
            <p className="section-label">scanned</p>
          </div>
          <div>
            <p className="font-serif text-2xl tabular" style={{ color: 'var(--petrol)' }}>{fmt(budget)}</p>
            <p className="section-label">budget</p>
          </div>
        </div>

        <div className="scanner h-1.5 rounded-full mb-4" style={{ background: 'var(--rule)' }} />

        <div className="space-y-2.5">
          {STAGES.map((label, i) => {
            const done = stage > i
            const active = stage === i
            return (
              <div key={i} className="flex items-center gap-2.5 text-xs"
                style={{ color: done ? 'var(--teal)' : active ? 'var(--ink)' : 'var(--stone)' }}>
                <span style={{ width: 16, display: 'inline-flex', justifyContent: 'center' }}>
                  {done ? (
                    <motion.svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}
                      initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 12 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </motion.svg>
                  ) : active ? (
                    <motion.span className="w-2 h-2 rounded-full" style={{ background: 'var(--petrol)' }}
                      animate={{ scale: [1, 1.5, 1], opacity: [1, 0.4, 1] }}
                      transition={{ duration: 1, repeat: Infinity }} />
                  ) : <span style={{ width: 6, height: 6, borderRadius: 99, border: '1.5px solid var(--rule)' }} />}
                </span>
                <span style={{ opacity: done ? 0.6 : 1 }}>{label}</span>
              </div>
            )
          })}
        </div>
      </motion.div>
    )
  }

  return (
    <div className="card p-5">
      <div className="flex items-baseline justify-between mb-4">
        <p className="section-label">Allocate Funds</p>
        <button onClick={() => setShowConstraints(!showConstraints)} className="btn-ghost text-[10px]">
          {showConstraints ? 'Hide' : 'Constraints'}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {showConstraints && (
          <motion.div className="overflow-hidden"
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={spring.ui}>
            <div className="mb-4 p-3 space-y-3 rounded-lg" style={{ background: 'var(--parchment)', border: '1px solid var(--rule)' }}>
              <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: 'var(--ink)' }}>
                <input type="checkbox" checked={equityOn} onChange={(e) => setEquityOn(e.target.checked)} />
                Apply equity cap
              </label>
              <div style={{ opacity: equityOn ? 1 : 0.4 }}>
                <label className="section-label block mb-1">
                  Max per region — {Math.round(constraints.max_per_region_ratio * 100)}% of budget
                </label>
                <input type="range" min="15" max="80" step="5" disabled={!equityOn}
                  value={Math.round(constraints.max_per_region_ratio * 100)}
                  onChange={(e) => setConstraints((p) => ({ ...p, max_per_region_ratio: parseInt(e.target.value) / 100 }))}
                  className="w-full" />
                <p className="text-[10px]" style={{ color: 'var(--stone)' }}>
                  No single state may absorb more than this share — forces geographic spread.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => onAllocate('optimizer', equityOn ? constraints.max_per_region_ratio : null)}
        disabled={allocating || proposalCount === 0}
        whileTap={reduce ? undefined : { scale: 0.97 }}
        className="btn-primary w-full">
        Run Allocation — {fmt(budget)}{equityOn && <span className="ml-1 opacity-80">· equity</span>}
      </motion.button>

      {onCompare && (
        <button onClick={onCompare} disabled={allocating || proposalCount === 0}
          className="btn-secondary w-full mt-2">
          Compare optimiser vs ranked
        </button>
      )}
    </div>
  )
}
