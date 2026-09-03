import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const INDUSTRIES = [
  'IT & Technology', 'Manufacturing', 'Banking & Finance', 'Pharmaceuticals',
  'Automobile', 'Energy & Infrastructure', 'FMCG', 'Telecom',
  'Mining & Metals', 'Chemicals', 'Other',
]

const COMPANY_SIZES = [
  '1-50 employees', '51-200 employees', '201-1000 employees',
  '1001-5000 employees', '5000+ employees',
]

export default function ProfilePage() {
  const { user, updateProfile, loading, error, clearError } = useAuth()
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    company_name: user?.company_name || '',
    contact_name: user?.contact_name || '',
    industry: user?.industry || '',
    company_size: user?.company_size || '',
    csr_budget: user?.csr_budget || '',
    headquarters: user?.headquarters || '',
    phone: user?.phone || '',
  })

  const update = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      await updateProfile({
        ...form,
        csr_budget: parseFloat(form.csr_budget) || 0,
      })
      setEditing(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      // error handled by context
    }
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in-up">
      {/* Back button */}
      <button
        onClick={() => window.history.back()}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-700 font-medium text-sm transition-colors mb-6"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Company Profile</h1>
        <p className="text-sm text-slate-400 mt-1">Manage your company details and CSR preferences</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
          <button onClick={clearError} className="ml-auto text-red-400 hover:text-red-600">
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

      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        {/* Company avatar + name */}
        <div className="px-8 py-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-md">
              {form.company_name?.charAt(0)?.toUpperCase() || 'C'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">{form.company_name || 'Your Company'}</h2>
              <p className="text-sm text-slate-400">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-8 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Company Name</label>
              <input
                type="text"
                value={form.company_name}
                onChange={e => update('company_name', e.target.value)}
                disabled={!editing}
                className={`w-full px-4 py-2.5 rounded-xl text-sm text-slate-800 transition-all ${
                  editing
                    ? 'bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400'
                    : 'bg-transparent border border-transparent'
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Contact Person</label>
              <input
                type="text"
                value={form.contact_name}
                onChange={e => update('contact_name', e.target.value)}
                disabled={!editing}
                className={`w-full px-4 py-2.5 rounded-xl text-sm text-slate-800 transition-all ${
                  editing
                    ? 'bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400'
                    : 'bg-transparent border border-transparent'
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Industry</label>
              {editing ? (
                <select
                  value={form.industry}
                  onChange={e => update('industry', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                >
                  <option value="">Select industry</option>
                  {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              ) : (
                <input
                  type="text"
                  value={form.industry || '—'}
                  disabled
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-slate-800 bg-transparent border border-transparent"
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Company Size</label>
              {editing ? (
                <select
                  value={form.company_size}
                  onChange={e => update('company_size', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                >
                  <option value="">Select size</option>
                  {COMPANY_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              ) : (
                <input
                  type="text"
                  value={form.company_size || '—'}
                  disabled
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-slate-800 bg-transparent border border-transparent"
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Annual CSR Budget (₹)</label>
              <input
                type="number"
                value={form.csr_budget}
                onChange={e => update('csr_budget', e.target.value)}
                disabled={!editing}
                className={`w-full px-4 py-2.5 rounded-xl text-sm text-slate-800 transition-all ${
                  editing
                    ? 'bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400'
                    : 'bg-transparent border border-transparent'
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Headquarters</label>
              <input
                type="text"
                value={form.headquarters}
                onChange={e => update('headquarters', e.target.value)}
                disabled={!editing}
                className={`w-full px-4 py-2.5 rounded-xl text-sm text-slate-800 transition-all ${
                  editing
                    ? 'bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400'
                    : 'bg-transparent border border-transparent'
                }`}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            {editing ? (
              <>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm"
                >
                  {loading ? 'Saving…' : 'Save Changes'}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="px-5 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Profile
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Quick stats */}
      <div className="mt-6 bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Account Info</h3>
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
