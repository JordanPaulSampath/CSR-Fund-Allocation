import { useAuth } from '../context/AuthContext'

const I = {
  proposals: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  settlement: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z',
  partners: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
  equity: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z',
  impact: 'M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941',
  compliance: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  csr2: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
  audit: 'M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z',
  projects: 'M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6',
  dataset: 'M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75',
}

function Icon({ d }) {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.6}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  )
}

const NAV = [
  { section: 'Allocation', items: [
    { id: 'proposals', label: 'Proposals', icon: I.proposals },
    { id: 'results', label: 'Settlement', icon: I.settlement },
    { id: 'partners', label: 'Partner Match', icon: I.partners },
    { id: 'equity', label: 'Equity Snapshot', icon: I.equity },
  ]},
  { section: 'Compliance', items: [
    { id: 'compliance', label: 'Compliance', icon: I.compliance },
    { id: 'csr2', label: 'CSR-2 Filing', icon: I.csr2 },
    { id: 'audit', label: 'Audit Trail', icon: I.audit },
  ]},
  { section: 'Operations', items: [
    { id: 'projects', label: 'Project Tracker', icon: I.projects },
    { id: 'impact', label: 'Impact Overview', icon: I.impact },
    { id: 'directory', label: 'Partner Directory', icon: I.partners },
  ]},
  { section: 'Data', items: [
    { id: 'dataset', label: 'Dataset & Sources', icon: I.dataset },
  ]},
]

export default function Sidebar({ activeView, setActiveView, collapsed, setCollapsed }) {
  const { user } = useAuth()

  return (
    <>
      {!collapsed && <div className="fixed inset-0 z-30 lg:hidden" style={{ background: 'rgba(15,23,42,0.3)' }} onClick={() => setCollapsed(true)} />}

      <aside className={`
        fixed lg:sticky top-0 left-0 z-40 lg:z-auto
        h-screen lg:h-[calc(100vh-52px)] lg:top-[52px]
        w-60 transition-transform duration-200
        ${collapsed ? '-translate-x-full lg:translate-x-0 lg:w-0 lg:overflow-hidden' : 'translate-x-0'}
        flex-shrink-0
      `}
        style={{ background: 'var(--paper)', borderRight: '1px solid var(--rule)' }}>
        <div className="h-full overflow-y-auto py-5 px-3">
          <div className="mb-5 px-2 pb-4" style={{ borderBottom: '1px solid var(--rule)' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{user?.company_name || 'Saarthi Demo Corp'}</p>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--stone)' }}>{user?.user} · {user?.role || 'CSR Manager'}</p>
          </div>

          {NAV.map((sec, si) => (
            <div key={sec.section} className="mb-4 animate-slide-in-left" style={{ animationDelay: `${si * 60}ms` }}>
              <p className="section-label mb-1.5 px-2">{sec.section}</p>
              {sec.items.map((item) => (
                <button key={item.id} onClick={() => setActiveView(item.id)}
                  className="nav-item" data-active={activeView === item.id}>
                  <Icon d={item.icon} />
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      </aside>
    </>
  )
}
