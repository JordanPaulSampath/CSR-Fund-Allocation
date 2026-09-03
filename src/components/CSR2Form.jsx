import { useState, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'

function formatCurrency(amount) {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`
  return `₹${amount.toLocaleString('en-IN')}`
}

// CSR-2 form fields (pre-filled from project data)
const CSR2_FIELDS = {
  company: {
    section: 'Company Details',
    fields: [
      { key: 'cin', label: 'Corporate Identity Number (CIN)', required: true, autoFill: 'U74999MH2020PTC123456' },
      { key: 'company_name', label: 'Company Name', required: true, autoFillFrom: 'company_name' },
      { key: 'registered_address', label: 'Registered Office Address', required: true, autoFill: '123 Business Park, Andheri East, Mumbai 400069' },
      { key: 'email', label: 'Official Email', required: true, autoFillFrom: 'email' },
      { key: 'sector', label: 'Primary Business Sector', required: true, autoFill: 'Information Technology' },
      { key: 'date_of_incorporation', label: 'Date of Incorporation', required: true, autoFill: '15/03/2010' },
    ],
  },
  financials: {
    section: 'Financial Details (FY 2024-25)',
    fields: [
      { key: 'net_worth', label: 'Net Worth (₹)', required: true, autoFill: '500000000', isFinancial: true },
      { key: 'turnover', label: 'Turnover (₹)', required: true, autoFill: '2000000000', isFinancial: true },
      { key: 'net_profit', label: 'Net Profit (₹)', required: true, autoFill: '150000000', isFinancial: true },
      { key: 'csr_obligation', label: 'CSR Obligation (2% of avg)', required: true, autoFill: '10000000', isFinancial: true },
      { key: 'csr_spent', label: 'Total CSR Spent (₹)', required: true, autoFill: '8400000', isFinancial: true },
      { key: 'unspent_amount', label: 'Unspent CSR Amount (₹)', required: true, autoFill: '1600000', isFinancial: true },
    ],
  },
  projects: {
    section: 'Project Details',
    fields: [
      { key: 'total_projects', label: 'Total CSR Projects', required: true, autoFill: '5' },
      { key: 'ongoing_projects', label: 'Ongoing Projects', required: true, autoFill: '3' },
      { key: 'new_projects', label: 'New Projects (this FY)', required: true, autoFill: '2' },
      { key: 'schedule_vii_areas', label: 'Schedule VII Areas Covered', required: true, autoFill: 'Education, Healthcare, Environment, Women Empowerment' },
      { key: 'beneficiaries', label: 'Total Beneficiaries', required: true, autoFill: '12500' },
      { key: 'geographical_coverage', label: 'Geographical Coverage', required: true, autoFill: 'Maharashtra, Rajasthan, Bihar, Karnataka, Tamil Nadu' },
    ],
  },
  compliance: {
    section: 'Compliance & Filing',
    fields: [
      { key: 'csr_committee', label: 'CSR Committee Formed', required: true, autoFill: 'Yes' },
      { key: 'csr_policy', label: 'CSR Policy Approved', required: true, autoFill: 'Yes' },
      { key: 'impact_assessment', label: 'Impact Assessment Done', required: false, autoFill: 'Yes' },
      { key: 'unspent_account', label: 'Unspent CSR Account Opened', required: true, autoFill: 'Yes' },
      { key: 'schedule_vii_transfer', label: 'Transferred to Schedule VII Fund', required: false, autoFill: 'Yes' },
      { key: 'board_resolution', label: 'Board Resolution for CSR', required: true, autoFill: 'Yes' },
    ],
  },
}

export default function CSR2Form() {
  const { user } = useAuth()
  const [formData, setFormData] = useState(() => {
    // Auto-fill from user data and mock project data
    const filled = {}
    Object.values(CSR2_FIELDS).forEach(section => {
      section.fields.forEach(field => {
        if (field.autoFillFrom && user?.[field.autoFillFrom]) {
          filled[field.key] = user[field.autoFillFrom]
        } else {
          filled[field.key] = field.autoFill || ''
        }
      })
    })
    return filled
  })

  const [activeSection, setActiveSection] = useState('company')
  const [showMissing, setShowMissing] = useState(false)

  // Count missing required fields
  const missingFields = useMemo(() => {
    const missing = []
    Object.values(CSR2_FIELDS).forEach(section => {
      section.fields.forEach(field => {
        if (field.required && !formData[field.key]) {
          missing.push({ ...field, section: section.section })
        }
      })
    })
    return missing
  }, [formData])

  const totalFields = Object.values(CSR2_FIELDS).reduce((s, sec) => s + sec.fields.length, 0)
  const filledFields = Object.values(formData).filter(v => v && v !== '').length
  const completionPct = totalFields > 0 ? (filledFields / totalFields) * 100 : 0

  // Days until CSR-2 filing deadline
  const deadline = new Date('2025-09-30')
  const daysLeft = Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24))

  const updateField = (key, value) => setFormData(prev => ({ ...prev, [key]: value }))

  const currentSection = CSR2_FIELDS[activeSection]

  return (
    <div className="space-y-5 sm:space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800">CSR-2 Filing</h1>
        <p className="text-sm text-slate-500 mt-1">Auto-filled from project data — review and export for MCA submission</p>
      </div>

      {/* Deadline + Completion */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 stagger">
        <div className="card p-4 sm:p-5 hover-lift">
          <p className="label text-[10px] sm:text-xs">Filing Deadline</p>
          <p className="text-xl sm:text-2xl font-bold text-slate-800 mt-1">{daysLeft > 0 ? `${daysLeft} days` : 'Overdue!'}</p>
          <p className="text-xs text-slate-400">30 September 2025</p>
        </div>
        <div className="card p-4 sm:p-5 hover-lift">
          <p className="label text-[10px] sm:text-xs">Completion</p>
          <p className="text-xl sm:text-2xl font-bold text-blue-600 mt-1">{completionPct.toFixed(0)}%</p>
          <p className="text-xs text-slate-400">{filledFields} of {totalFields} fields filled</p>
        </div>
        <div className="card p-4 sm:p-5 hover-lift">
          <p className="label text-[10px] sm:text-xs">Missing Fields</p>
          <p className={`text-xl sm:text-2xl font-bold mt-1 ${missingFields.length > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {missingFields.length}
          </p>
          <p className="text-xs text-slate-400">{missingFields.length === 0 ? 'All required fields filled' : 'Required fields need attention'}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="card p-4 sm:p-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="section-title">Form Progress</h3>
          <button onClick={() => setShowMissing(!showMissing)} className="btn-ghost text-xs">
            {showMissing ? 'Hide' : 'Show'} missing fields
          </button>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-700 ${
            completionPct === 100 ? 'bg-emerald-500' : completionPct >= 80 ? 'bg-blue-500' : 'bg-amber-500'
          }`} style={{ width: `${completionPct}%` }} />
        </div>
        <div className="flex justify-between mt-1.5 text-xs text-slate-400">
          <span>{filledFields} filled</span>
          <span>{totalFields} total</span>
        </div>

        {/* Missing fields list */}
        {showMissing && missingFields.length > 0 && (
          <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-100 animate-fade-in-up">
            <p className="text-xs font-semibold text-amber-700 mb-2">Missing Required Fields:</p>
            <div className="space-y-1">
              {missingFields.map(f => (
                <p key={f.key} className="text-xs text-amber-600">• {f.label} ({f.section})</p>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 bg-slate-100/80 rounded-xl p-1 overflow-x-auto">
        {Object.entries(CSR2_FIELDS).map(([key, section]) => {
          const filled = section.fields.filter(f => formData[f.key]).length
          return (
            <button key={key} onClick={() => setActiveSection(key)}
              className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeSection === key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}>
              {section.section.split(' ')[0]}
              <span className={`ml-1.5 text-[10px] ${filled === section.fields.length ? 'text-emerald-500' : 'text-slate-400'}`}>
                {filled}/{section.fields.length}
              </span>
            </button>
          )
        })}
      </div>

      {/* Form fields */}
      <div className="card p-5 sm:p-6">
        <h3 className="section-title mb-4">{currentSection.section}</h3>
        <div className="space-y-4">
          {currentSection.fields.map(field => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <input
                type={field.isFinancial ? 'number' : 'text'}
                value={formData[field.key] || ''}
                onChange={e => updateField(field.key, e.target.value)}
                placeholder={field.autoFill ? `Auto-filled: ${field.isFinancial ? formatCurrency(parseFloat(field.autoFill)) : field.autoFill}` : ''}
                className={`input ${!formData[field.key] && field.required ? '!border-amber-300' : ''}`}
              />
              {field.autoFill && !formData[field.key] && (
                <p className="text-[10px] text-blue-500 mt-1">Auto-filled from project data — edit if needed</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Export actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button className="btn-primary flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export as PDF
        </button>
        <button className="btn-secondary flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export as Excel
        </button>
      </div>
    </div>
  )
}
