import { useState } from 'react'

function formatCurrency(amount) {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`
  return `₹${amount.toLocaleString('en-IN')}`
}

const MOCK_PROJECTS = [
  {
    id: 1, name: 'Digital Literacy for Rural Schools', ngo: 'Helping Hands Foundation',
    sector: 'Education', region: 'Maharashtra', budget: 420000, spent: 315000,
    status: 'active', start_date: '2025-01-15', end_date: '2025-12-31',
    milestones: [
      { name: 'Needs assessment', completed: true, date: '2025-02-01', amount: 80000 },
      { name: 'Infrastructure setup', completed: true, date: '2025-04-15', amount: 150000 },
      { name: 'Teacher training', completed: false, date: '2025-07-01', amount: 120000 },
      { name: 'Impact evaluation', completed: false, date: '2025-11-30', amount: 70000 },
    ],
    tranches: [
      { amount: 80000, status: 'released', date: '2025-02-05' },
      { amount: 150000, status: 'released', date: '2025-04-20' },
      { amount: 120000, status: 'pending', date: null },
      { amount: 70000, status: 'pending', date: null },
    ],
    updates: [
      { date: '2025-06-15', type: 'photo', text: 'Computers installed in 3 schools', ngo: 'Helping Hands Foundation' },
      { date: '2025-05-20', type: 'report', text: 'Monthly progress report uploaded', ngo: 'Helping Hands Foundation' },
    ],
  },
  {
    id: 2, name: 'Clean Water Initiative', ngo: 'Green Future Trust',
    sector: 'Water & Sanitation', region: 'Rajasthan', budget: 650000, spent: 520000,
    status: 'active', start_date: '2025-02-01', end_date: '2026-01-31',
    milestones: [
      { name: 'Site survey', completed: true, date: '2025-03-01', amount: 50000 },
      { name: 'Well construction', completed: true, date: '2025-05-30', amount: 300000 },
      { name: 'Filtration system', completed: true, date: '2025-07-15', amount: 200000 },
      { name: 'Community training', completed: false, date: '2025-10-01', amount: 100000 },
    ],
    tranches: [
      { amount: 50000, status: 'released', date: '2025-02-10' },
      { amount: 300000, status: 'released', date: '2025-04-05' },
      { amount: 200000, status: 'released', date: '2025-06-20' },
      { amount: 100000, status: 'pending', date: null },
    ],
    updates: [
      { date: '2025-07-20', type: 'photo', text: 'Filtration system operational, 200 families served', ngo: 'Green Future Trust' },
    ],
  },
  {
    id: 3, name: 'Women Self-Help Group Program', ngo: 'Pragati Mahila Sangh',
    sector: 'Women Empowerment', region: 'Bihar', budget: 380000, spent: 190000,
    status: 'active', start_date: '2025-03-01', end_date: '2026-02-28',
    milestones: [
      { name: 'SHG formation', completed: true, date: '2025-04-30', amount: 80000 },
      { name: 'Skill training', completed: true, date: '2025-07-15', amount: 120000 },
      { name: 'Micro-enterprise setup', completed: false, date: '2025-10-30', amount: 100000 },
      { name: 'Sustainability review', completed: false, date: '2026-01-15', amount: 80000 },
    ],
    tranches: [
      { amount: 80000, status: 'released', date: '2025-03-20' },
      { amount: 120000, status: 'released', date: '2025-06-10' },
      { amount: 100000, status: 'pending', date: null },
      { amount: 80000, status: 'pending', date: null },
    ],
    updates: [
      { date: '2025-07-18', type: 'report', text: '12 SHGs formed, 150 women enrolled', ngo: 'Pragati Mahila Sangh' },
    ],
  },
]

const STATUS_COLORS = {
  active: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-blue-100 text-blue-700',
  delayed: 'bg-amber-100 text-amber-700',
}

export default function ProjectTracker() {
  const [selectedProject, setSelectedProject] = useState(null)
  const [activeTab, setActiveTab] = useState('overview') // overview | milestones | disbursements | updates

  const projects = MOCK_PROJECTS

  if (selectedProject) {
    const project = projects.find(p => p.id === selectedProject)
    return <ProjectDetail project={project} onBack={() => setSelectedProject(null)} activeTab={activeTab} setActiveTab={setActiveTab} />
  }

  return (
    <div className="space-y-5 sm:space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Project Tracker</h1>
        <p className="text-sm text-slate-500 mt-1">Monitor milestones, disbursements, and field updates across all projects</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 stagger">
        {[
          { label: 'Active Projects', value: projects.filter(p => p.status === 'active').length, color: 'text-emerald-600' },
          { label: 'Total Budget', value: formatCurrency(projects.reduce((s, p) => s + p.budget, 0)), color: 'text-blue-600' },
          { label: 'Total Spent', value: formatCurrency(projects.reduce((s, p) => s + p.spent, 0)), color: 'text-indigo-600' },
          { label: 'Pending Tranches', value: projects.reduce((s, p) => s + p.tranches.filter(t => t.status === 'pending').length, 0), color: 'text-amber-600' },
        ].map(card => (
          <div key={card.label} className="card p-4 sm:p-5 hover-lift">
            <p className="label text-[10px] sm:text-xs">{card.label}</p>
            <p className={`text-xl sm:text-2xl font-bold mt-1 ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Project list */}
      <div className="card overflow-hidden">
        <div className="px-4 sm:px-5 py-3 bg-slate-50/80 border-b border-slate-100">
          <h3 className="section-title">All Projects</h3>
        </div>
        <div className="divide-y divide-slate-50">
          {projects.map(project => {
            const completedMilestones = project.milestones.filter(m => m.completed).length
            const totalMilestones = project.milestones.length
            const progressPct = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0
            const budgetPct = project.budget > 0 ? (project.spent / project.budget) * 100 : 0

            return (
              <button
                key={project.id}
                onClick={() => setSelectedProject(project.id)}
                className="w-full px-4 sm:px-5 py-4 text-left hover:bg-blue-50/30 transition-colors duration-150"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-slate-800 truncate">{project.name}</p>
                      <span className={`badge text-[10px] ${STATUS_COLORS[project.status]}`}>{project.status}</span>
                    </div>
                    <p className="text-xs text-slate-400">{project.ngo} · {project.sector} · {project.region}</p>
                  </div>

                  <div className="flex items-center gap-4 sm:gap-6">
                    {/* Milestone progress */}
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Milestones</p>
                      <p className="text-sm font-semibold text-slate-700">{completedMilestones}/{totalMilestones}</p>
                    </div>

                    {/* Budget bar */}
                    <div className="w-24 sm:w-32">
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                        <span>{formatCurrency(project.spent)}</span>
                        <span>{budgetPct.toFixed(0)}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${budgetPct}%` }} />
                      </div>
                    </div>

                    <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function ProjectDetail({ project, onBack, activeTab, setActiveTab }) {
  const completedMilestones = project.milestones.filter(m => m.completed).length
  const totalMilestones = project.milestones.length
  const progressPct = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0
  const budgetPct = project.budget > 0 ? (project.spent / project.budget) * 100 : 0
  const releasedTranches = project.tranches.filter(t => t.status === 'released')
  const pendingTranches = project.tranches.filter(t => t.status === 'pending')

  return (
    <div className="space-y-5 sm:space-y-6 animate-fade-in-up">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 font-medium text-sm transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Projects
      </button>

      {/* Project header */}
      <div className="card p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-lg sm:text-xl font-bold text-slate-800">{project.name}</h1>
              <span className={`badge text-xs ${STATUS_COLORS[project.status]}`}>{project.status}</span>
            </div>
            <p className="text-sm text-slate-500">{project.ngo} · {project.sector} · {project.region}</p>
            <p className="text-xs text-slate-400 mt-1">
              {new Date(project.start_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
              {' — '}
              {new Date(project.end_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
            </p>
          </div>

          <div className="flex gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{progressPct.toFixed(0)}%</p>
              <p className="text-xs text-slate-400">Complete</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(project.spent)}</p>
              <p className="text-xs text-slate-400">of {formatCurrency(project.budget)}</p>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-700" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100/80 rounded-xl p-1">
        {['overview', 'milestones', 'disbursements', 'updates'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
              activeTab === tab ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="card p-5">
            <h3 className="section-title mb-3">Budget Utilization</h3>
            <div className="h-6 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full" style={{ width: `${budgetPct}%` }} />
            </div>
            <div className="flex justify-between mt-2 text-xs text-slate-500">
              <span>{formatCurrency(project.spent)} spent</span>
              <span>{formatCurrency(project.budget)} budget</span>
            </div>
          </div>
          <div className="card p-5">
            <h3 className="section-title mb-3">Milestone Progress</h3>
            <p className="text-3xl font-bold text-blue-600">{completedMilestones}/{totalMilestones}</p>
            <p className="text-xs text-slate-400 mt-1">milestones completed</p>
          </div>
        </div>
      )}

      {activeTab === 'milestones' && (
        <div className="card p-5 sm:p-6">
          <div className="space-y-3">
            {project.milestones.map((m, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${
                m.completed ? 'bg-emerald-50 border border-emerald-100' : 'bg-slate-50 border border-slate-100'
              }`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                  m.completed ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'
                }`}>
                  {m.completed ? (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="text-xs font-bold">{i + 1}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${m.completed ? 'text-emerald-800' : 'text-slate-800'}`}>{m.name}</p>
                  <p className="text-xs text-slate-400">Due: {new Date(m.date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</p>
                </div>
                <span className="text-sm font-semibold text-slate-600">{formatCurrency(m.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'disbursements' && (
        <div className="card p-5 sm:p-6">
          <h3 className="section-title mb-4">Fund Disbursements</h3>
          <div className="space-y-3">
            {project.tranches.map((t, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${
                t.status === 'released' ? 'bg-emerald-50 border border-emerald-100' : 'bg-amber-50 border border-amber-100'
              }`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  t.status === 'released' ? 'bg-emerald-100' : 'bg-amber-100'
                }`}>
                  {t.status === 'released' ? (
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800">Tranche {i + 1}</p>
                  <p className="text-xs text-slate-400">
                    {t.status === 'released' ? `Released ${new Date(t.date).toLocaleDateString('en-IN')}` : 'Pending approval'}
                  </p>
                </div>
                <span className="text-sm font-bold text-slate-700">{formatCurrency(t.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'updates' && (
        <div className="card p-5 sm:p-6">
          <h3 className="section-title mb-4">Field Updates</h3>
          {project.updates.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No updates yet</p>
          ) : (
            <div className="space-y-3">
              {project.updates.map((u, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    {u.type === 'photo' ? (
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800">{u.text}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{u.ngo} · {new Date(u.date).toLocaleDateString('en-IN')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
