import { useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { spring, storyEase, stampIn, staggerParent, fadeUp } from '../lib/motion'
import SpringNumber from './SpringNumber'

function money(amount) {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`
  return `₹${Math.round(amount).toLocaleString('en-IN')}`
}

function ScoreBar({ score }) {
  const pct = Math.min((score / 10) * 100, 100)
  return (
    <div className="flex items-center gap-2">
      <div className="score-bar">
        <motion.div className="score-bar-fill" style={{ height: '100%' }}
          initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ ...storyEase, delay: 0.3 }} />
      </div>
      <span className="font-serif text-xs tabular" style={{ color: 'var(--ink)' }}>{score.toFixed(1)}</span>
    </div>
  )
}

function Seal({ delay = 0 }) {
  return (
    <motion.div className="seal seal-filled" style={{ flex: 'none' }}
      initial={{ scale: 0, rotate: -25 }} animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 14, delay }}>
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </motion.div>
  )
}

function EmptySeal() {
  return <div className="seal" style={{ borderColor: 'var(--rule)', flex: 'none' }} />
}

export default function ResultsView({ result, proposals, budget }) {
  const reduce = useReducedMotion()

  const funded = useMemo(() => (result?.funded || []).slice().sort((a, b) => (b.final_score || 0) - (a.final_score || 0)), [result])
  const rejected = useMemo(() => (result?.rejected || []).slice().sort((a, b) => (b.final_score || 0) - (a.final_score || 0)), [result])

  const totalFunded = result?.spent || funded.reduce((s, p) => s + (p.requested_amount || 0), 0)
  const totalBudget = result?.total_budget || budget
  const utilizationPct = totalBudget > 0 ? Math.min((totalFunded / totalBudget) * 100, 100) : 0

  const proofMoment = useMemo(() => {
    if (funded.length === 0 || rejected.length === 0) return null
    const lowestFunded = funded.reduce((min, p) => (p.final_score || 0) < (min.final_score || 0) ? p : min, funded[0])
    const higherRejected = rejected.filter(p => (p.final_score || 0) > (lowestFunded.final_score || 0))
    if (higherRejected.length === 0) return null
    const highestRejected = higherRejected.reduce((max, p) => (p.final_score || 0) > (max.final_score || 0) ? p : max, higherRejected[0])
    return { funded: lowestFunded, rejected: highestRejected }
  }, [funded, rejected])

  return (
    <div className="space-y-8">

      {/* ── Hero — the payoff number, springs up and counts ── */}
      <motion.div className="text-center py-6"
        initial={{ opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={spring.story}>
        <p className="font-serif text-3xl sm:text-4xl" style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}>
          <SpringNumber value={totalFunded} format={money} level="story" />
          <span style={{ color: 'var(--stone)' }}> of </span>
          <SpringNumber value={totalBudget} format={money} level="story" />
        </p>
        <p className="text-xs mt-2 section-label">
          allocated across {funded.length} of {funded.length + rejected.length} proposals
        </p>
        {result?.solver && (
          <p className="text-[10px] mt-1" style={{ color: 'var(--stone)' }}>solver: {result.solver}</p>
        )}
      </motion.div>

      {/* ── Budget utilisation bar — glides to width ── */}
      <motion.div initial={fadeUp.hidden} animate={fadeUp.show}>
        <p className="section-label mb-2">Budget Utilisation</p>
        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--rule)' }}>
          <motion.div className="h-full rounded-full" style={{ background: 'var(--petrol)' }}
            initial={{ width: 0 }} animate={{ width: `${utilizationPct}%` }}
            transition={{ ...storyEase, delay: 0.25 }} />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="font-serif text-xs tabular" style={{ color: 'var(--ink)' }}>{money(totalFunded)}</span>
          <span className="text-xs" style={{ color: 'var(--stone)' }}>{money(totalBudget)}</span>
        </div>
      </motion.div>

      {/* ── Allocation insight ── */}
      {proofMoment && (
        <motion.div className="card p-5"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring.ui, delay: 0.35 }}>
          <p className="section-label mb-3">Allocation Insight</p>
          <div className="flex flex-col sm:flex-row items-stretch gap-4">
            <div className="flex-1 p-4 rounded-lg" style={{ border: '1px solid var(--rule)' }}>
              <div className="flex items-center gap-2 mb-2">
                <Seal delay={0.5} />
                <span className="section-label" style={{ color: 'var(--teal)' }}>Funded</span>
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{proofMoment.funded.ngo_name}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--stone)' }}>{proofMoment.funded.title}</p>
              <div className="flex items-center gap-3 mt-2">
                <ScoreBar score={proofMoment.funded.final_score} />
                <span className="font-serif text-sm tabular" style={{ color: 'var(--ink)' }}>{money(proofMoment.funded.requested_amount)}</span>
              </div>
            </div>
            <div className="flex-1 p-4 rounded-lg" style={{ border: '1px solid var(--rule)', opacity: 0.75 }}>
              <div className="flex items-center gap-2 mb-2">
                <EmptySeal />
                <span className="section-label">Not funded</span>
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{proofMoment.rejected.ngo_name}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--stone)' }}>{proofMoment.rejected.title}</p>
              <div className="flex items-center gap-3 mt-2">
                <ScoreBar score={proofMoment.rejected.final_score} />
                <span className="font-serif text-sm tabular" style={{ color: 'var(--ink)' }}>{money(proofMoment.rejected.requested_amount)}</span>
              </div>
            </div>
          </div>
          <p className="text-xs mt-3 italic" style={{ color: 'var(--stone)' }}>
            A lower-scored proposal was funded — it fit the budget better alongside the others.
          </p>
        </motion.div>
      )}

      {/* ── Funded register — rows stamp in one after another ── */}
      <div>
        <div className="flex items-baseline justify-between mb-2">
          <p className="section-label">Funded — {funded.length}</p>
          <span className="font-serif text-xs tabular" style={{ color: 'var(--teal)' }}>{money(totalFunded)}</span>
        </div>
        <div className="card overflow-hidden">
          <div className="register" style={{ borderTop: 'none' }}>
            {funded.map((p, i) => (
              <motion.div key={p.id || i} className="register-row"
                custom={reduce ? 0 : Math.min(i, 12)} variants={stampIn} initial="hidden" animate="show">
                <Seal delay={reduce ? 0 : 0.15 + Math.min(i, 12) * 0.07} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{p.ngo_name}</p>
                  <p className="text-[10px]" style={{ color: 'var(--stone)' }}>{p.title} · {p.region}</p>
                </div>
                <div className="text-right">
                  <p className="font-serif text-sm tabular" style={{ color: 'var(--ink)' }}>{money(p.requested_amount)}</p>
                  <ScoreBar score={p.final_score} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Rejected register ── */}
      <motion.div variants={staggerParent(0.02)} initial="hidden" animate="show">
        <div className="flex items-baseline justify-between mb-2">
          <p className="section-label">Not funded — {rejected.length}</p>
          <span className="text-xs" style={{ color: 'var(--stone)' }}>{money(rejected.reduce((s, p) => s + (p.requested_amount || 0), 0))}</span>
        </div>
        <div className="card overflow-hidden">
          <div className="register" style={{ borderTop: 'none' }}>
            {rejected.slice(0, 40).map((p, i) => (
              <motion.div key={p.id || i} className="register-row" style={{ opacity: 0.72 }} variants={fadeUp}>
                <EmptySeal />
                <div className="flex-1 min-w-0">
                  <p className="text-sm" style={{ color: 'var(--ink)' }}>{p.ngo_name}</p>
                  <p className="text-[10px]" style={{ color: 'var(--stone)' }}>{p.title} · {p.region}</p>
                </div>
                <div className="text-right">
                  <p className="font-serif text-sm tabular" style={{ color: 'var(--ink)' }}>{money(p.requested_amount)}</p>
                  <ScoreBar score={p.final_score} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        {rejected.length > 40 && (
          <p className="text-[10px] mt-2" style={{ color: 'var(--stone)' }}>+ {rejected.length - 40} more not shown</p>
        )}
      </motion.div>

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
