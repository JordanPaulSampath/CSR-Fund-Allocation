import { useEffect, useState } from 'react'
import { remainingBudgetAdvice } from '../services/api'

function formatCurrency(amount) {
  if (amount == null) return '—'
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`
  return `₹${Number(amount).toLocaleString('en-IN')}`
}

const LABELS = {
  next_best: 'Fund the next-best fit',
  partial_fund: 'Offer partial funding',
  rollover: 'Roll over to next cycle',
  fully_utilised: 'Budget fully utilised',
  none: 'No recommendation yet',
}

// Pillar 6 — leftover-funds advisor. Works off the most recent allocation run.
// `trigger` is any value that changes when a new allocation completes, so the
// card re-fetches (e.g. pass the AllocationResult object).
export default function BudgetAdvisor({ trigger }) {
  const [advice, setAdvice] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(null)
    remainingBudgetAdvice()
      .then((a) => alive && setAdvice(a))
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [trigger])

  if (loading && !advice) return null
  if (error) {
    return (
      <div className="p-4" style={{ background: 'var(--paper)', border: '1px solid var(--rule)' }}>
        <p className="section-label mb-1">Remaining-Budget Advisor</p>
        <p className="text-xs" style={{ color: 'var(--stone)' }}>{error}</p>
      </div>
    )
  }
  if (!advice) return null

  const isRollover = advice.type === 'rollover'
  const accent = isRollover ? 'var(--brass)' : 'var(--petrol)'

  return (
    <div className="p-5" style={{ background: 'var(--paper)', border: '1px solid var(--rule)', borderLeft: `3px solid ${accent}` }}>
      <div className="flex items-baseline justify-between mb-2">
        <p className="section-label">Remaining-Budget Advisor</p>
        <span className="text-[10px] uppercase" style={{ color: accent, letterSpacing: '0.08em', fontWeight: 600 }}>
          {LABELS[advice.type] || advice.type}
        </span>
      </div>

      <p className="font-serif text-2xl" style={{ color: 'var(--ink)' }}>
        {formatCurrency(advice.leftover)} <span className="text-sm" style={{ color: 'var(--stone)' }}>unspent</span>
      </p>

      {advice.total_budget != null && (
        <p className="text-[10px] mt-1" style={{ color: 'var(--stone)' }}>
          {formatCurrency(advice.spent)} of {formatCurrency(advice.total_budget)} allocated ·
          {' '}{advice.candidates_considered} near-miss {advice.candidates_considered === 1 ? 'proposal' : 'proposals'} considered
        </p>
      )}

      <p className="text-xs mt-3" style={{ color: 'var(--ink)' }}>{advice.rationale}</p>

      {advice.target_title && (
        <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--rule)' }}>
          <p className="text-[10px] uppercase" style={{ color: 'var(--stone)', letterSpacing: '0.08em' }}>Target proposal</p>
          <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{advice.target_title}</p>
          <p className="text-[10px]" style={{ color: 'var(--stone)' }}>
            {advice.target_ngo}
            {advice.target_ask != null && ` · asks ${formatCurrency(advice.target_ask)}`}
            {advice.coverage != null && ` · ${Math.round(advice.coverage * 100)}% covered`}
          </p>
        </div>
      )}

      <p className="text-[10px] mt-3 italic" style={{ color: 'var(--stone)' }}>
        Advisory only — recommendation is recorded, never auto-committed.
      </p>
    </div>
  )
}
