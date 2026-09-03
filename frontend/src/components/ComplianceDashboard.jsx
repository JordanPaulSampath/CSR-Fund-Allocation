import { useState, useMemo } from 'react'

function formatCurrency(amount) {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`
  return `₹${amount.toLocaleString('en-IN')}`
}

const DEADLINES = [
  { date: '2025-04-30', label: 'Transfer ongoing unspent to CSR Account' },
  { date: '2025-06-30', label: 'Board approves Annual CSR Report' },
  { date: '2025-09-30', label: 'Transfer non-ongoing unspent to Schedule VII' },
  { date: '2025-09-30', label: 'File CSR-2 with MCA' },
  { date: '2025-12-31', label: 'Complete Impact Assessment' },
]

export default function ComplianceDashboard({ budget }) {
  const [financials, setFinancials] = useState({
    net_worth: 500000000, turnover: 2000000000, net_profit: 150000000,
  })

  const obligation = useMemo(() => {
    const avg = (financials.net_worth + financials.turnover + financials.net_profit) / 3
    return Math.floor(avg * 0.02)
  }, [financials])

  const actualSpend = budget * 0.84
  const complianceStatus = actualSpend >= obligation ? 'compliant' : 'non-compliant'
  const spendPct = obligation > 0 ? Math.min((actualSpend / obligation) * 100, 100) : 0

  const upcomingDeadlines = useMemo(() => {
    const now = new Date()
    return DEADLINES.map(d => {
      const daysLeft = Math.ceil((new Date(d.date) - now) / (1000 * 60 * 60 * 24))
      return { ...d, daysLeft }
    }).filter(d => d.daysLeft > 0).sort((a, b) => a.daysLeft - b.daysLeft)
  }, [])

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="font-serif text-xl" style={{ color: 'var(--ink)' }}>Compliance Dashboard</h1>

      {/* Status line */}
      <div className="p-4 flex items-center gap-3" style={{
        background: complianceStatus === 'compliant' ? 'rgba(31,75,67,0.04)' : 'rgba(178,59,59,0.04)',
        border: `1px solid ${complianceStatus === 'compliant' ? 'var(--petrol)' : 'var(--brick)'}`,
      }}>
        <div className="seal seal-filled" style={{ borderColor: complianceStatus === 'compliant' ? 'var(--petrol)' : 'var(--brick)', background: complianceStatus === 'compliant' ? 'var(--petrol)' : 'var(--brick)' }}>
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
            {complianceStatus === 'compliant' ? 'CSR Compliant' : 'Non-Compliant'}
          </p>
          <p className="text-xs" style={{ color: 'var(--stone)' }}>
            {formatCurrency(actualSpend)} spent of {formatCurrency(obligation)} obligation
          </p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px" style={{ background: 'var(--rule)' }}>
        {[
          { label: 'Obligation', value: formatCurrency(obligation) },
          { label: 'Spent', value: formatCurrency(actualSpend) },
          { label: 'Unspent', value: formatCurrency(Math.max(0, obligation - actualSpend)) },
          { label: 'Penalty Risk', value: complianceStatus === 'compliant' ? '₹0' : formatCurrency(Math.floor((obligation - actualSpend) * 0.02)) },
        ].map(card => (
          <div key={card.label} className="p-4" style={{ background: 'var(--paper)' }}>
            <p className="stat-label">{card.label}</p>
            <p className="stat-value mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Obligation calculator */}
      <div className="p-5" style={{ background: 'var(--paper)', border: '1px solid var(--rule)' }}>
        <p className="section-label mb-3">Obligation Calculator</p>
        <p className="text-[10px] mb-4" style={{ color: 'var(--stone)' }}>
          CSR applies if net worth ≥ ₹500 Cr OR turnover ≥ ₹1000 Cr OR net profit ≥ ₹5 Cr (Section 135)
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          {[
            { key: 'net_worth', label: 'Net Worth' },
            { key: 'turnover', label: 'Turnover' },
            { key: 'net_profit', label: 'Net Profit' },
          ].map(f => (
            <div key={f.key}>
              <label className="section-label block mb-1">{f.label} (₹)</label>
              <input type="number" value={financials[f.key]}
                onChange={e => setFinancials(prev => ({ ...prev, [f.key]: parseFloat(e.target.value) || 0 }))}
                className="input" />
              <p className="text-[10px] mt-1 font-serif tabular" style={{ color: 'var(--stone)' }}>
                {formatCurrency(financials[f.key])}
              </p>
            </div>
          ))}
        </div>
        <div className="p-3" style={{ background: 'var(--parchment)', border: '1px solid var(--rule)' }}>
          <div className="flex justify-between text-xs mb-1">
            <span style={{ color: 'var(--stone)' }}>Average of financials</span>
            <span className="font-serif tabular" style={{ color: 'var(--ink)' }}>{formatCurrency(Math.floor((financials.net_worth + financials.turnover + financials.net_profit) / 3))}</span>
          </div>
          <div className="flex justify-between text-xs mb-1">
            <span style={{ color: 'var(--stone)' }}>CSR Rate</span>
            <span className="font-serif tabular" style={{ color: 'var(--ink)' }}>2%</span>
          </div>
          <div className="flex justify-between text-xs pt-2 mt-2" style={{ borderTop: '1px solid var(--rule)' }}>
            <span className="font-medium" style={{ color: 'var(--ink)' }}>Obligation</span>
            <span className="font-serif text-sm tabular" style={{ color: 'var(--petrol)' }}>{formatCurrency(obligation)}</span>
          </div>
        </div>
      </div>

      {/* Deadlines */}
      <div className="p-5" style={{ background: 'var(--paper)', border: '1px solid var(--rule)' }}>
        <p className="section-label mb-3">Upcoming Deadlines</p>
        <div className="register">
          {upcomingDeadlines.map((d, i) => (
            <div key={i} className="register-row">
              <div className="flex-1">
                <p className="text-sm" style={{ color: 'var(--ink)' }}>{d.label}</p>
                <p className="text-[10px]" style={{ color: 'var(--stone)' }}>
                  {new Date(d.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <span className="font-serif text-xs tabular px-2 py-0.5" style={{
                color: d.daysLeft <= 30 ? 'var(--brick)' : 'var(--ink)',
                border: `1px solid ${d.daysLeft <= 30 ? 'var(--brick)' : 'var(--rule)'}`,
              }}>
                {d.daysLeft}d
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
