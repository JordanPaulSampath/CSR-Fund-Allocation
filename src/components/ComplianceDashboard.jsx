import { useState, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'

function formatCurrency(amount) {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`
  return `₹${amount.toLocaleString('en-IN')}`
}

function formatIndianNumber(amount) {
  if (amount >= 100000000) return `₹${(amount / 100000000).toFixed(2)} Cr`
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`
  return `₹${amount.toLocaleString('en-IN')}`
}

// Deadline data for CSR annual cycle
const DEADLINES = [
  { date: '2025-04-30', label: 'Transfer ongoing unspent to CSR Account', status: 'upcoming', icon: '🏦' },
  { date: '2025-06-30', label: 'Board approves Annual CSR Report', status: 'upcoming', icon: '📋' },
  { date: '2025-09-30', label: 'Transfer non-ongoing unspent to Schedule VII', status: 'upcoming', icon: '💸' },
  { date: '2025-09-30', label: 'File CSR-2 with MCA', status: 'upcoming', icon: '📄' },
  { date: '2025-12-31', label: 'Complete Impact Assessment (if applicable)', status: 'upcoming', icon: '📊' },
]

export default function ComplianceDashboard({ budget }) {
  const { user } = useAuth()

  // Company financials (editable for demo)
  const [financials, setFinancials] = useState({
    net_worth: 500000000,    // ₹50 Cr
    turnover: 2000000000,    // ₹200 Cr
    net_profit: 150000000,   // ₹15 Cr
    previous_year_unspent: 20000000, // ₹2 Cr
  })

  // Calculate CSR obligation (2% of average of net worth/turnover/net profit)
  const obligation = useMemo(() => {
    const avg = (financials.net_worth + financials.turnover + financials.net_profit) / 3
    return Math.floor(avg * 0.02)
  }, [financials])

  // Simulated spend data
  const [spend, setSpend] = useState({
    total_spent: 0,
    projects_funded: 0,
    ongoing_projects: 0,
    unspent_ongoing: 0,
    unspent_nonongoing: 0,
  })

  // Calculate from budget prop
  const actualSpend = budget * 0.84 // simulate 84% utilization
  const complianceStatus = actualSpend >= obligation ? 'compliant' : actualSpend >= obligation * 0.9 ? 'warning' : 'non-compliant'

  const spendPct = obligation > 0 ? Math.min((actualSpend / obligation) * 100, 100) : 0

  // Days until each deadline
  const upcomingDeadlines = useMemo(() => {
    const now = new Date()
    return DEADLINES.map(d => {
      const deadline = new Date(d.date)
      const daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24))
      return { ...d, daysLeft, isPast: daysLeft < 0 }
    }).filter(d => !d.isPast).sort((a, b) => a.daysLeft - b.daysLeft)
  }, [])

  return (
    <div className="space-y-5 sm:space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Compliance Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">CSR obligation tracking, deadline alerts, and compliance status</p>
      </div>

      {/* ── Compliance Status Banner ── */}
      <div className={`rounded-2xl p-5 sm:p-6 border-2 ${
        complianceStatus === 'compliant'
          ? 'bg-emerald-50 border-emerald-200'
          : complianceStatus === 'warning'
          ? 'bg-amber-50 border-amber-200'
          : 'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            complianceStatus === 'compliant' ? 'bg-emerald-100' :
            complianceStatus === 'warning' ? 'bg-amber-100' : 'bg-red-100'
          }`}>
            {complianceStatus === 'compliant' ? (
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            ) : complianceStatus === 'warning' ? (
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <div>
            <h3 className={`text-base font-bold ${
              complianceStatus === 'compliant' ? 'text-emerald-800' :
              complianceStatus === 'warning' ? 'text-amber-800' : 'text-red-800'
            }`}>
              {complianceStatus === 'compliant' ? 'CSR Compliant ✓' :
               complianceStatus === 'warning' ? 'Approaching Deadline ⚠️' : 'Non-Compliant ✗'}
            </h3>
            <p className={`text-sm ${
              complianceStatus === 'compliant' ? 'text-emerald-600' :
              complianceStatus === 'warning' ? 'text-amber-600' : 'text-red-600'
            }`}>
              {complianceStatus === 'compliant'
                ? `You've met your CSR obligation of ${formatCurrency(obligation)}`
                : complianceStatus === 'warning'
                ? `${formatCurrency(obligation - actualSpend)} remaining to meet obligation`
                : `${formatCurrency(obligation - actualSpend)} shortfall — penalty risk under Section 13(7)`
              }
            </p>
          </div>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 stagger">
        {[
          { label: 'CSR Obligation', value: formatCurrency(obligation), sub: '2% of avg financials', color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Total Spent', value: formatCurrency(actualSpend), sub: `${spendPct.toFixed(1)}% of obligation`, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Unspent Amount', value: formatCurrency(Math.max(0, obligation - actualSpend)), sub: 'Pending transfer', color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Penalty Risk', value: complianceStatus === 'compliant' ? '₹0' : formatCurrency(Math.floor((obligation - actualSpend) * 0.02)), sub: '2% per year under Sec 13(7)', color: 'text-red-600', bg: 'bg-red-50' },
        ].map(card => (
          <div key={card.label} className="card p-4 sm:p-5 hover-lift">
            <p className="label text-[10px] sm:text-xs">{card.label}</p>
            <p className={`text-xl sm:text-2xl font-bold mt-1 ${card.color}`}>{card.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Obligation Calculator ── */}
      <div className="card p-5 sm:p-6">
        <h3 className="section-title mb-4">Obligation Calculator</h3>
        <p className="text-xs text-slate-400 mb-4">CSR applies if net worth ≥ ₹500 Cr OR turnover ≥ ₹1000 Cr OR net profit ≥ ₹5 Cr (Section 135)</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          {[
            { key: 'net_worth', label: 'Net Worth', placeholder: '500000000' },
            { key: 'turnover', label: 'Turnover', placeholder: '2000000000' },
            { key: 'net_profit', label: 'Net Profit', placeholder: '150000000' },
          ].map(f => (
            <div key={f.key}>
              <label className="label block mb-1.5">{f.label} (₹)</label>
              <input
                type="number"
                value={financials[f.key]}
                onChange={e => setFinancials(prev => ({ ...prev, [f.key]: parseFloat(e.target.value) || 0 }))}
                className="input"
              />
              <p className="text-xs text-slate-400 mt-1">{formatIndianNumber(financials[f.key])}</p>
            </div>
          ))}
        </div>

        {/* Calculation breakdown */}
        <div className="bg-slate-50 rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Average of (Net Worth + Turnover + Net Profit) / 3</span>
            <span className="font-semibold text-slate-800">{formatCurrency(Math.floor((financials.net_worth + financials.turnover + financials.net_profit) / 3))}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">CSR Rate</span>
            <span className="font-semibold text-slate-800">2%</span>
          </div>
          <div className="border-t border-slate-200 pt-2 flex justify-between text-sm">
            <span className="font-medium text-slate-700">CSR Obligation</span>
            <span className="font-bold text-blue-600 text-lg">{formatCurrency(obligation)}</span>
          </div>
        </div>

        {/* Applicability check */}
        <div className="mt-4 flex flex-wrap gap-3">
          {[
            { label: 'Net Worth ≥ ₹500 Cr', met: financials.net_worth >= 500000000 },
            { label: 'Turnover ≥ ₹1000 Cr', met: financials.turnover >= 1000000000 },
            { label: 'Net Profit ≥ ₹5 Cr', met: financials.net_profit >= 50000000 },
          ].map(check => (
            <span key={check.label} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
              check.met ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
            }`}>
              {check.met ? '✓' : '○'} {check.label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Spend vs Obligation Bar ── */}
      <div className="card p-5 sm:p-6">
        <h3 className="section-title mb-3">Spend vs Obligation</h3>
        <div className="relative">
          <div className="h-8 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out relative animate-budget-fill ${
                complianceStatus === 'compliant' ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' :
                complianceStatus === 'warning' ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
                'bg-gradient-to-r from-red-400 to-red-500'
              }`}
              style={{ width: `${spendPct}%` }}
            >
              {spendPct > 18 && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-white drop-shadow-sm">
                  {formatCurrency(actualSpend)}
                </span>
              )}
            </div>
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-500">
            <span className="font-medium">{formatCurrency(actualSpend)} spent</span>
            <span>{formatCurrency(obligation)} obligation</span>
          </div>
        </div>
      </div>

      {/* ── Deadline Alerts ── */}
      <div className="card p-5 sm:p-6">
        <h3 className="section-title mb-4">Upcoming Deadlines</h3>
        <div className="space-y-3">
          {upcomingDeadlines.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">No upcoming deadlines this year</p>
          ) : (
            upcomingDeadlines.map((d, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                d.daysLeft <= 30 ? 'bg-red-50 border border-red-100' :
                d.daysLeft <= 90 ? 'bg-amber-50 border border-amber-100' :
                'bg-slate-50 border border-slate-100'
              }`}>
                <span className="text-lg flex-shrink-0">{d.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{d.label}</p>
                  <p className="text-xs text-slate-400">{new Date(d.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <span className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-bold ${
                  d.daysLeft <= 30 ? 'bg-red-100 text-red-700' :
                  d.daysLeft <= 90 ? 'bg-amber-100 text-amber-700' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {d.daysLeft}d left
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Committee Suggestion ── */}
      <div className="card p-5 sm:p-6">
        <h3 className="section-title mb-3">CSR Committee Composition</h3>
        <p className="text-xs text-slate-400 mb-4">Suggested based on company type (Section 135(1))</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { role: 'Chairperson', desc: 'Independent Director or Board nominee', required: true },
            { role: '2+ Directors', desc: 'At least one independent director', required: true },
            { role: 'CSR Manager', desc: 'Company officer to execute CSR policy', required: false },
            { role: 'Finance Head', desc: 'Oversight of fund allocation and reporting', required: false },
            { role: 'External Expert', desc: 'Social impact or NGO sector expertise', required: false },
            { role: 'Company Secretary', desc: 'Compliance and filing responsibilities', required: false },
          ].map(member => (
            <div key={member.role} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${member.required ? 'bg-blue-500' : 'bg-slate-300'}`} />
              <div>
                <p className="text-sm font-medium text-slate-800">{member.role} {member.required && <span className="text-[10px] text-blue-600">Required</span>}</p>
                <p className="text-xs text-slate-400 mt-0.5">{member.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
