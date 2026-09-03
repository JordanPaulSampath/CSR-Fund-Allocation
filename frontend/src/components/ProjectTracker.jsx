import { useState } from 'react'

function formatCurrency(amount) {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`
  return `₹${amount.toLocaleString('en-IN')}`
}

const MOCK_PROJECTS = [
  {
    id: 1, name: 'Digital Literacy for Rural Schools', ngo: 'Helping Hands Foundation',
    sector: 'Education', region: 'Maharashtra', budget: 420000, spent: 315000, status: 'active',
    milestones: [
      { name: 'Needs assessment', done: true, amount: 80000 },
      { name: 'Infrastructure setup', done: true, amount: 150000 },
      { name: 'Teacher training', done: false, amount: 120000 },
      { name: 'Impact evaluation', done: false, amount: 70000 },
    ],
    tranches: [
      { amount: 80000, status: 'released' }, { amount: 150000, status: 'released' },
      { amount: 120000, status: 'pending' }, { amount: 70000, status: 'pending' },
    ],
  },
  {
    id: 2, name: 'Clean Water Initiative', ngo: 'Green Future Trust',
    sector: 'Water & Sanitation', region: 'Rajasthan', budget: 650000, spent: 520000, status: 'active',
    milestones: [
      { name: 'Site survey', done: true, amount: 50000 },
      { name: 'Well construction', done: true, amount: 300000 },
      { name: 'Filtration system', done: true, amount: 200000 },
      { name: 'Community training', done: false, amount: 100000 },
    ],
    tranches: [
      { amount: 50000, status: 'released' }, { amount: 300000, status: 'released' },
      { amount: 200000, status: 'released' }, { amount: 100000, status: 'pending' },
    ],
  },
  {
    id: 3, name: 'Women Self-Help Group Program', ngo: 'Pragati Mahila Sangh',
    sector: 'Women Empowerment', region: 'Bihar', budget: 380000, spent: 190000, status: 'active',
    milestones: [
      { name: 'SHG formation', done: true, amount: 80000 },
      { name: 'Skill training', done: true, amount: 120000 },
      { name: 'Micro-enterprise setup', done: false, amount: 100000 },
      { name: 'Sustainability review', done: false, amount: 80000 },
    ],
    tranches: [
      { amount: 80000, status: 'released' }, { amount: 120000, status: 'released' },
      { amount: 100000, status: 'pending' }, { amount: 80000, status: 'pending' },
    ],
  },
]

export default function ProjectTracker() {
  const [selected, setSelected] = useState(null)

  if (selected) {
    const p = MOCK_PROJECTS.find(x => x.id === selected)
    const done = p.milestones.filter(m => m.done).length
    const pct = (done / p.milestones.length) * 100
    return (
      <div className="space-y-5 animate-fade-in">
        <button onClick={() => setSelected(null)} className="text-xs" style={{ color: 'var(--stone)' }}>← Back to projects</button>

        <div className="p-5" style={{ background: 'var(--paper)', border: '1px solid var(--rule)' }}>
          <p className="section-label mb-1">{p.ngo}</p>
          <h2 className="font-serif text-lg" style={{ color: 'var(--ink)' }}>{p.name}</h2>
          <p className="text-xs mt-1" style={{ color: 'var(--stone)' }}>{p.sector} · {p.region}</p>

          <div className="h-1.5 mt-4 rounded-sm overflow-hidden" style={{ background: 'var(--rule)' }}>
            <div className="h-full rounded-sm" style={{ width: `${pct}%`, background: 'var(--petrol)' }} />
          </div>
          <p className="text-[10px] mt-1" style={{ color: 'var(--stone)' }}>{done}/{p.milestones.length} milestones · {formatCurrency(p.spent)} of {formatCurrency(p.budget)}</p>
        </div>

        {/* Milestones */}
        <div className="p-5" style={{ background: 'var(--paper)', border: '1px solid var(--rule)' }}>
          <p className="section-label mb-3">Milestones</p>
          <div className="register">
            {p.milestones.map((m, i) => (
              <div key={i} className="register-row">
                <span style={{ width: '14px', textAlign: 'center', color: m.done ? 'var(--petrol)' : 'var(--stone)' }}>
                  {m.done ? '✓' : '○'}
                </span>
                <span className="flex-1 text-sm" style={{ color: 'var(--ink)' }}>{m.name}</span>
                <span className="font-serif text-xs tabular" style={{ color: 'var(--ink)' }}>{formatCurrency(m.amount)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Disbursements */}
        <div className="p-5" style={{ background: 'var(--paper)', border: '1px solid var(--rule)' }}>
          <p className="section-label mb-3">Disbursements</p>
          <div className="register">
            {p.tranches.map((t, i) => (
              <div key={i} className="register-row">
                <span style={{ width: '14px', textAlign: 'center', color: t.status === 'released' ? 'var(--petrol)' : 'var(--stone)' }}>
                  {t.status === 'released' ? '✓' : '○'}
                </span>
                <span className="flex-1 text-sm" style={{ color: 'var(--ink)' }}>Tranche {i + 1}</span>
                <span className="font-serif text-xs tabular" style={{ color: 'var(--ink)' }}>{formatCurrency(t.amount)}</span>
                <span className="text-[10px]" style={{ color: 'var(--stone)' }}>{t.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="font-serif text-xl" style={{ color: 'var(--ink)' }}>Project Tracker</h1>

      <div className="register">
        {MOCK_PROJECTS.map(p => {
          const done = p.milestones.filter(m => m.done).length
          const pct = (done / p.milestones.length) * 100
          return (
            <button key={p.id} onClick={() => setSelected(p.id)}
              className="register-row w-full text-left cursor-pointer">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{p.name}</p>
                <p className="text-[10px]" style={{ color: 'var(--stone)' }}>{p.ngo} · {p.sector}</p>
              </div>
              <div className="w-24">
                <div className="h-1 rounded-sm" style={{ background: 'var(--rule)' }}>
                  <div className="h-full rounded-sm" style={{ width: `${pct}%`, background: 'var(--petrol)' }} />
                </div>
                <p className="text-[10px] text-right mt-0.5" style={{ color: 'var(--stone)' }}>{done}/{p.milestones.length}</p>
              </div>
              <span className="font-serif text-sm tabular" style={{ color: 'var(--ink)' }}>{formatCurrency(p.spent)}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
