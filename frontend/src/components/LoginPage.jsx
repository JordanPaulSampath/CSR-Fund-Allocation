import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login, signup, loading, error, clearError } = useAuth()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ username: '', email: '', password: '', company_name: '' })
  const [showPassword, setShowPassword] = useState(false)

  const update = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (mode === 'login') await login(form.username, form.password)
      else await signup({ username: form.username, email: form.email, password: form.password, company_name: form.company_name })
    } catch {}
  }

  const demoLogin = async () => {
    clearError()
    setForm(f => ({ ...f, username: 'csr_manager', password: 'saarthi2026' }))
    try { await login('csr_manager', 'saarthi2026') } catch {}
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--parchment)' }}>
      <div className="w-full max-w-sm">
        {/* Cover page header */}
        <div className="mb-10 text-center animate-fade-in">
          <h1 className="font-serif text-3xl sm:text-4xl" style={{ color: 'var(--ink)', letterSpacing: '-0.01em' }}>
            CSR Helper
          </h1>
          <hr className="mt-4 mx-auto" style={{ width: '60px', borderColor: 'var(--brass)', borderWidth: '1px' }} />
          <p className="mt-3 text-xs" style={{ color: 'var(--stone)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Intelligent Fund Allocation
          </p>
        </div>

        {/* Register card */}
        <div className="p-6 sm:p-8 animate-fade-in" style={{ background: 'var(--paper)', border: '1px solid var(--rule)' }}>
          {/* Tab toggle */}
          <div className="flex mb-6" style={{ borderBottom: '1px solid var(--rule)' }}>
            <button onClick={() => { setMode('login'); clearError() }}
              className="flex-1 pb-2 text-xs font-semibold uppercase tracking-widest transition-colors"
              style={{
                color: mode === 'login' ? 'var(--petrol)' : 'var(--stone)',
                borderBottom: mode === 'login' ? '2px solid var(--petrol)' : '2px solid transparent',
              }}>
              Sign In
            </button>
            <button onClick={() => { setMode('signup'); clearError() }}
              className="flex-1 pb-2 text-xs font-semibold uppercase tracking-widest transition-colors"
              style={{
                color: mode === 'signup' ? 'var(--petrol)' : 'var(--stone)',
                borderBottom: mode === 'signup' ? '2px solid var(--petrol)' : '2px solid transparent',
              }}>
              Sign Up
            </button>
          </div>

          {error && (
            <div className="mb-4 px-3 py-2 text-xs" style={{ background: 'rgba(178,59,59,0.06)', border: '1px solid rgba(178,59,59,0.2)', color: 'var(--brick)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="section-label block mb-1.5">Username</label>
              <input type="text" value={form.username} onChange={e => update('username', e.target.value)}
                placeholder="Enter username" required className="input" autoComplete="username" />
            </div>

            {mode === 'signup' && (
              <>
                <div>
                  <label className="section-label block mb-1.5">Email</label>
                  <input type="email" value={form.email} onChange={e => update('email', e.target.value)}
                    placeholder="csr@company.com" required className="input" autoComplete="email" />
                </div>
                <div>
                  <label className="section-label block mb-1.5">Company Name</label>
                  <input type="text" value={form.company_name} onChange={e => update('company_name', e.target.value)}
                    placeholder="Company Pvt. Ltd." className="input" />
                </div>
              </>
            )}

            <div>
              <label className="section-label block mb-1.5">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={form.password}
                  onChange={e => update('password', e.target.value)}
                  placeholder={mode === 'signup' ? 'Min 6 characters' : 'Enter password'}
                  required minLength={mode === 'signup' ? 6 : undefined}
                  className="input pr-10" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--stone)' }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d={showPassword ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M3 3l18 18" : "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"} />
                  </svg>
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading || !form.username || !form.password}
              className="btn-primary w-full mt-2">
              {loading ? 'Processing…' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {mode === 'login' && (
            <div className="mt-5 pt-4" style={{ borderTop: '1px solid var(--rule)' }}>
              <button type="button" onClick={demoLogin} disabled={loading}
                className="btn-secondary w-full">
                Continue as demo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
