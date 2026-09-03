import { useState, useMemo } from 'react'

function formatCurrency(amount) {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`
  return `₹${amount.toLocaleString('en-IN')}`
}

const CSR2_SECTIONS = {
  company: {
    title: 'Company Details',
    fields: [
      { key: 'cin', label: 'CIN', auto: 'U74999MH2020PTC123456' },
      { key: 'company_name', label: 'Company Name', auto: 'Acme Corp Pvt. Ltd.' },
      { key: 'email', label: 'Official Email', auto: 'csr@acmecorp.com' },
      { key: 'sector', label: 'Business Sector', auto: 'Information Technology' },
    ],
  },
  financials: {
    title: 'Financial Details (FY 2024-25)',
    fields: [
      { key: 'net_worth', label: 'Net Worth', auto: '500000000', isMoney: true },
      { key: 'turnover', label: 'Turnover', auto: '2000000000', isMoney: true },
      { key: 'net_profit', label: 'Net Profit', auto: '150000000', isMoney: true },
      { key: 'csr_obligation', label: 'CSR Obligation (2%)', auto: '10000000', isMoney: true },
      { key: 'csr_spent', label: 'Total CSR Spent', auto: '8400000', isMoney: true },
    ],
  },
  projects: {
    title: 'Project Details',
    fields: [
      { key: 'total_projects', label: 'Total Projects', auto: '5' },
      { key: 'ongoing', label: 'Ongoing Projects', auto: '3' },
      { key: 'schedule_vii', label: 'Schedule VII Areas', auto: 'Education, Healthcare, Environment' },
      { key: 'beneficiaries', label: 'Total Beneficiaries', auto: '12500' },
    ],
  },
  compliance: {
    title: 'Compliance & Filing',
    fields: [
      { key: 'committee', label: 'CSR Committee Formed', auto: 'Yes' },
      { key: 'policy', label: 'CSR Policy Approved', auto: 'Yes' },
      { key: 'impact', label: 'Impact Assessment Done', auto: 'Yes' },
      { key: 'unspent', label: 'Unspent CSR Account Opened', auto: 'Yes' },
    ],
  },
}

export default function CSR2Form() {
  const [formData, setFormData] = useState(() => {
    const filled = {}
    Object.values(CSR2_SECTIONS).forEach(sec => sec.fields.forEach(f => { filled[f.key] = f.auto || '' }))
    return filled
  })
  const [activeSection, setActiveSection] = useState('company')

  const totalFields = Object.values(CSR2_SECTIONS).reduce((s, sec) => s + sec.fields.length, 0)
  const filledFields = Object.values(formData).filter(v => v && v !== '').length
  const completionPct = totalFields > 0 ? (filledFields / totalFields) * 100 : 0

  const deadline = new Date('2025-09-30')
  const daysLeft = Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24))

  const currentSection = CSR2_SECTIONS[activeSection]

  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="font-serif text-xl" style={{ color: 'var(--ink)' }}>CSR-2 Filing</h1>

      {/* Deadline + completion */}
      <div className="flex gap-px" style={{ background: 'var(--rule)' }}>
        <div className="flex-1 p-4" style={{ background: 'var(--paper)' }}>
          <p className="stat-label">Deadline</p>
          <p className="stat-value">{daysLeft > 0 ? `${daysLeft} days` : 'Overdue'}</p>
        </div>
        <div className="flex-1 p-4" style={{ background: 'var(--paper)' }}>
          <p className="stat-label">Completion</p>
          <p className="stat-value">{completionPct.toFixed(0)}%</p>
        </div>
        <div className="flex-1 p-4" style={{ background: 'var(--paper)' }}>
          <p className="stat-label">Fields</p>
          <p className="stat-value">{filledFields}/{totalFields}</p>
        </div>
      </div>

      {/* Progress */}
      <div>
        <div className="h-1 rounded-sm overflow-hidden" style={{ background: 'var(--rule)' }}>
          <div className="h-full rounded-sm" style={{ width: `${completionPct}%`, background: 'var(--petrol)' }} />
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex gap-px overflow-x-auto" style={{ background: 'var(--rule)' }}>
        {Object.entries(CSR2_SECTIONS).map(([key, sec]) => (
          <button key={key} onClick={() => setActiveSection(key)}
            className="px-4 py-2 text-xs font-medium whitespace-nowrap"
            style={{
              background: activeSection === key ? 'var(--paper)' : 'var(--parchment)',
              color: activeSection === key ? 'var(--petrol)' : 'var(--stone)',
              borderBottom: activeSection === key ? '2px solid var(--petrol)' : '2px solid transparent',
            }}>
            {sec.title.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Form fields — government form layout */}
      <div className="p-5" style={{ background: 'var(--paper)', border: '1px solid var(--rule)' }}>
        <p className="section-label mb-4">{currentSection.title}</p>
        <div className="space-y-4">
          {currentSection.fields.map(field => (
            <div key={field.key}>
              <label className="section-label block mb-1">{field.label}</label>
              <input type="text" value={formData[field.key] || ''}
                onChange={e => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                className="input" />
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button className="btn-primary">Export PDF</button>
        <button className="btn-secondary">Export Excel</button>
      </div>
    </div>
  )
}
