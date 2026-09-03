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

export default function SignupPage({ onSwitchToLogin }) {
  const { signup, loading, error, clearError } = useAuth()
  const [form, setForm] = useState({
    company_name: '',
    contact_name: '',
    email: '',
    password: '',
    confirm_password: '',
    industry: '',
    company_size: '',
    csr_budget: '',
    headquarters: '',
  })
  const [showPassword, setShowPassword] = useState(false)

  const update = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirm_password) return
    if (!form.company_name || !form.email || !form.password) return
    try {
      await signup({
        company_name: form.company_name,
        contact_name: form.contact_name,
        email: form.email,
        password: form.password,
        industry: form.industry,
        company_size: form.company_size,
        csr_budget: parseFloat(form.csr_budget) || 0,
        headquarters: form.headquarters,
      })
    } catch {
      // error handled by context
    }
  }

  const pwdMismatch = form.confirm_password && form.password !== form.confirm_password

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Create your account</h1>
          <p className="text-sm text-slate-400 mt-1">Set up your company's CSR allocation dashboard</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-lg p-8 animate-fade-in-up">
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

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Company name */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Company Name *</label>
              <input
                type="text"
                value={form.company_name}
                onChange={e => update('company_name', e.target.value)}
                placeholder="Acme Corp Pvt. Ltd."
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
              />
            </div>

            {/* Contact name */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Contact Person</label>
              <input
                type="text"
                value={form.contact_name}
                onChange={e => update('contact_name', e.target.value)}
                placeholder="Rajesh Kumar"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
              />
            </div>

            {/* Email + Password */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Work Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={e => update('email', e.target.value)}
                placeholder="csr@acmecorp.com"
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => update('password', e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={8}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Confirm Password *</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.confirm_password}
                  onChange={e => update('confirm_password', e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                    pwdMismatch ? 'border-red-300 focus:border-red-400' : 'border-slate-200 focus:border-blue-400'
                  }`}
                />
                {pwdMismatch && <p className="text-xs text-red-500 mt-1">Passwords don't match</p>}
              </div>
            </div>

            {/* Industry + Size */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Industry</label>
                <select
                  value={form.industry}
                  onChange={e => update('industry', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                >
                  <option value="">Select industry</option>
                  {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Company Size</label>
                <select
                  value={form.company_size}
                  onChange={e => update('company_size', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                >
                  <option value="">Select size</option>
                  {COMPANY_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* CSR Budget + HQ */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Annual CSR Budget (₹)</label>
                <input
                  type="number"
                  value={form.csr_budget}
                  onChange={e => update('csr_budget', e.target.value)}
                  placeholder="5000000"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Headquarters</label>
                <input
                  type="text"
                  value={form.headquarters}
                  onChange={e => update('headquarters', e.target.value)}
                  placeholder="Mumbai, India"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !form.company_name || !form.email || !form.password || pwdMismatch}
              className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-sm hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account…
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-400">
              Already have an account?{' '}
              <button
                onClick={onSwitchToLogin}
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
