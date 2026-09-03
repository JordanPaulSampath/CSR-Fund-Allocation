import { useAuth } from '../context/AuthContext'

export default function Header({ budget, setBudget, activeView, setActiveView, sidebarOpen, setSidebarOpen }) {
  const { user, logout } = useAuth()

  return (
    <header className="sticky top-0 z-50" style={{ background: 'var(--paper)', borderBottom: '1px solid var(--rule)' }}>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between" style={{ height: '52px' }}>
          {/* Left: toggle + title */}
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5" style={{ color: 'var(--stone)' }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                {sidebarOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  : <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />}
              </svg>
            </button>
            <span className="font-serif text-base font-normal" style={{ color: 'var(--ink)' }}>CSR Helper</span>
          </div>

          {/* Center: Budget — the hero number */}
          <div className="hidden sm:flex items-center gap-3">
            <span className="section-label">Budget</span>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--stone)' }}>₹</span>
              <input type="number" value={budget} onChange={e => setBudget(Number(e.target.value) || 0)}
                className="font-serif text-lg font-normal pl-7 pr-3 py-1 text-right"
                style={{
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '2px solid var(--brass)',
                  color: 'var(--ink)',
                  width: '160px',
                  outline: 'none',
                  fontVariantNumeric: 'tabular-nums',
                }} />
            </div>
          </div>

          {/* Right: user + sign out */}
          <div className="flex items-center gap-3">
            {user && (
              <span className="text-xs hidden sm:block" style={{ color: 'var(--stone)' }}>
                {user.company_name || user.user}
              </span>
            )}
            <button onClick={logout} className="btn-ghost text-xs" style={{ color: 'var(--stone)' }}>
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
