import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const INDUSTRIES = [
  'IT & Technology', 'Manufacturing', 'Banking & Finance', 'Pharmaceuticals',
  'Automobile', 'Energy & Infrastructure', 'FMCG', 'Telecom',
  'Mining & Metals', 'Chemicals', 'Other',
]
const COMPANY_SIZES = ['1-50 employees', '51-200 employees', '201-1000 employees', '1001-5000 employees', '5000+ employees']

export default function ProfilePage() {
  const { user, updateProfile, loading, error, clearError } = useAuth()
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    company_name: user?.company_name || '', contact_name: user?.contact_name || '',
    industry: user?.industry || '', company_size: user?.company_size || '',
    csr_budget: user?.csr_budget || '', headquarters: user?.headquarters || '',
  })

  const update = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      await updateProfile({ ...form, csr_budget: parseFloat(form.csr_budget) || 0 })
      setEditing(false); setSaved(true); setTimeout(() => setSaved(false), 3000)
    } catch {}
  }

  const Field = ({ label, field, disabled, children }) => (
    <div>
      <label className="label block mb-1.5">{label}</label>
      {children !== undefined ? children : (
        <input type="text" value={form[field]} onChange={e => update(field, e.target.value)} disabled={disabled}
          className={`input ${disabled ? '!bg-transparent !border-transparent !shadow-none' : ''}`} />
      )}
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto animate-fade-in-up">
      <button onClick={() => window.history.back()}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-700 font-medium text-sm transition-colors mb-5 sm:mb-6">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Company Profile</h1>
      <p className="text-sm text-slate-400 mt-1 mb-6 sm:mb-8">Manage your company details and CSR preferences</p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
          <button onClick={clearError} className="ml-auto text-red-400 hover:text-red-600 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {saved && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-600 text-sm flex items-center gap-2 animate-fade-in-up">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Profile updated successfully
        </div>
      )}

      <div className="card overflow-hidden">
        {/* Header */}
        <div className="px-5 sm:px-8 py-5 sm:py-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-lg sm:text-xl font-bold shadow-md flex-shrink-0">
              {form.company_name?.charAt(0)?.toUpperCase() || 'C'}
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-slate-800 truncate">{form.company_name || 'Your Company'}</h2>
              <p className="text-sm text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-5 sm:p-8 space-y-4 sm:space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <Field label="Company Name" field="company_name" disabled={!editing} />
            <Field label="Contact Person" field="contact_name" disabled={!editing} />
            <div>
              <label className="label block mb-1.5">Industry</label>
              {editing ? (
                <select value={form.industry} onChange={e => update('industry', e.target.value)} className="input">
                  <option value="">Select industry</option>
                  {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              ) : (
                <input type="text" value={form.industry || '—'} disabled className="input !bg-transparent !border-transparent !shadow-none" />
              )}
            </div>
            <div>
              <label className="label block mb-1.5">Company Size</label>
              {editing ? (
                <select value={form.company_size} onChange={e => update('company_size', e.target.value)} className="input">
                  <option value="">Select size</option>
                  {COMPANY_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              ) : (
                <input type="text" value={form.company_size || '—'} disabled className="input !bg-transparent !border-transparent !shadow-none" />
              )}
            </div>
            <Field label="Annual CSR Budget (₹)" field="csr_budget" disabled={!editing} />
            <Field label="Headquarters" field="headquarters" disabled={!editing} />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            {editing ? (
              <>
                <button type="button" onClick={() => setEditing(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? 'Saving…' : 'Save Changes'}
                </button>
              </>
            ) : (
              <button type="button" onClick={() => setEditing(true)} className="btn-secondary flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Profile
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Account info */}
      <div className="card p-5 sm:p-6 mt-5 sm:mt-6">
        <h3 className="section-title mb-3">Account Info</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Email</span>
            <span className="text-slate-700 font-medium">{user?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Member since</span>
            <span className="text-slate-700 font-medium">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' }) : 'Today'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
