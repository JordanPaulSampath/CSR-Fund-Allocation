import { useAuth } from '../context/AuthContext'

const NAV_ITEMS = [
  {
    section: 'Fund Allocation',
    items: [
      { id: 'proposals', label: 'Proposals', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
      { id: 'results', label: 'Results', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', needsData: true },
    ],
  },
  {
    section: 'Compliance',
    items: [
      { id: 'compliance', label: 'Compliance Dashboard', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
      { id: 'csr2', label: 'CSR-2 Filing', icon: 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z' },
    ],
  },
  {
    section: 'Operations',
    items: [
      { id: 'projects', label: 'Project Tracker', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
    ],
  },
]

export default function Sidebar({ activeView, setActiveView, collapsed, setCollapsed }) {
  const { user } = useAuth()

  return (
    <>
      {!collapsed && <div className="fixed inset-0 bg-black/20 z-40 lg:hidden" onClick={() => setCollapsed(true)} />}

      <aside className={`
        fixed lg:sticky top-0 left-0 z-40 lg:z-auto
        h-screen lg:h-auto lg:top-16
        w-64 bg-white border-r border-slate-200/60
        transition-transform duration-300 ease-out
        ${collapsed ? '-translate-x-full lg:translate-x-0 lg:w-0 lg:overflow-hidden lg:border-0' : 'translate-x-0'}
        flex-shrink-0
      `}>
        <div className="h-full overflow-y-auto py-4 px-3">
          <div className="mb-5 px-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                {user?.user?.charAt(0)?.toUpperCase() || 'C'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{user?.user || 'CSR Manager'}</p>
                <p className="text-[10px] text-slate-400">CSR Manager</p>
              </div>
            </div>
          </div>

          {NAV_ITEMS.map(section => (
            <div key={section.section} className="mb-4">
              <p className="px-2 mb-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{section.section}</p>
              <div className="space-y-0.5">
                {section.items.map(item => {
                  const isActive = activeView === item.id
                  return (
                    <button key={item.id} onClick={() => setActiveView(item.id)}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                        isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                      }`}>
                      <svg className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                      </svg>
                      {item.label}
                      {item.id === 'results' && <span className="ml-auto text-[10px] text-slate-400">●</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </aside>
    </>
  )
}
