import { useAuth } from '../context/AuthContext'

const NAV_ITEMS = [
  { section: 'Allocation', items: [
    { id: 'proposals', label: 'Proposals' },
    { id: 'results', label: 'Settlement' },
  ]},
  { section: 'Compliance', items: [
    { id: 'compliance', label: 'Compliance' },
    { id: 'csr2', label: 'CSR-2 Filing' },
  ]},
  { section: 'Operations', items: [
    { id: 'projects', label: 'Project Tracker' },
  ]},
]

export default function Sidebar({ activeView, setActiveView, collapsed, setCollapsed }) {
  const { user } = useAuth()

  return (
    <>
      {!collapsed && <div className="fixed inset-0 z-30 lg:hidden" style={{ background: 'rgba(27,33,31,0.2)' }} onClick={() => setCollapsed(true)} />}

      <aside className={`
        fixed lg:sticky top-0 left-0 z-40 lg:z-auto
        h-screen lg:h-auto lg:top-[52px]
        w-56 transition-transform duration-200
        ${collapsed ? '-translate-x-full lg:translate-x-0 lg:w-0 lg:overflow-hidden' : 'translate-x-0'}
        flex-shrink-0
      `}
        style={{ background: 'var(--paper)', borderRight: '1px solid var(--rule)' }}>
        <div className="h-full overflow-y-auto py-5 px-4">
          {/* User identity */}
          <div className="mb-6 pb-4" style={{ borderBottom: '1px solid var(--rule)' }}>
            <p className="text-xs font-medium" style={{ color: 'var(--ink)' }}>{user?.user || 'CSR Manager'}</p>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--stone)' }}>CSR Manager</p>
          </div>

          {/* Nav sections */}
          {NAV_ITEMS.map(section => (
            <div key={section.section} className="mb-5">
              <p className="section-label mb-2">{section.section}</p>
              {section.items.map(item => {
                const isActive = activeView === item.id
                return (
                  <button key={item.id} onClick={() => setActiveView(item.id)}
                    className="w-full text-left px-2 py-1.5 text-sm rounded transition-colors"
                    style={{
                      color: isActive ? 'var(--petrol)' : 'var(--ink)',
                      fontWeight: isActive ? 600 : 400,
                      background: isActive ? 'rgba(31,75,67,0.05)' : 'transparent',
                    }}>
                    {item.label}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </aside>
    </>
  )
}
