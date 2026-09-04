import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { spring, staggerParent, fadeUp } from '../lib/motion'
import SpringNumber from './SpringNumber'

function money(n) {
  if (!n) return '₹0'
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`
  return `₹${Math.round(n).toLocaleString('en-IN')}`
}

// Compact metric strip for the proposals view — computed client-side from the
// loaded proposals so it always matches what's on screen.
export default function SummaryStats({ proposals = [], budget = 0 }) {
  const s = useMemo(() => {
    const total = proposals.length
    const requested = proposals.reduce((a, p) => a + (p.requested_amount || 0), 0)
    const beneficiaries = proposals.reduce((a, p) => a + (p.beneficiaries || 0), 0)
    const sectors = new Set(proposals.map((p) => p.sector)).size
    const regions = new Set(proposals.map((p) => p.region)).size
    const avgScore = total ? proposals.reduce((a, p) => a + (p.final_score || 0), 0) / total : 0
    const funded = proposals.filter((p) => p.is_funded).length
    return { total, requested, beneficiaries, sectors, regions, avgScore, funded }
  }, [proposals])

  if (!proposals.length) return null

  const coverage = s.requested > 0 ? Math.min((budget / s.requested) * 100, 100) : 0

  const cells = [
    { label: 'Proposals', num: s.total, fmt: (n) => Math.round(n).toString(), sub: s.funded ? `${s.funded} funded` : `${s.sectors} sectors` },
    { label: 'Requested', num: s.requested, fmt: money, sub: `budget covers ${coverage.toFixed(0)}%` },
    { label: 'Beneficiaries', num: s.beneficiaries, fmt: (n) => Math.round(n).toLocaleString('en-IN'), sub: 'across all proposals' },
    { label: 'Regions', num: s.regions, fmt: (n) => Math.round(n).toString(), sub: `${s.sectors} sectors` },
    { label: 'Avg score', num: s.avgScore, fmt: (n) => n.toFixed(1), sub: 'out of 10' },
  ]

  return (
    <motion.div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3"
      variants={staggerParent(0.05)} initial="hidden" animate="show">
      {cells.map((c) => (
        <motion.div key={c.label} variants={fadeUp}
          whileHover={{ y: -3, transition: spring.micro }}
          className="card card-hover p-3.5">
          <p className="stat-label">{c.label}</p>
          <p className="stat-value mt-1" style={{ fontSize: '1.25rem' }}>
            <SpringNumber value={c.num} format={c.fmt} level="story" />
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--stone)' }}>{c.sub}</p>
        </motion.div>
      ))}
    </motion.div>
  )
}
