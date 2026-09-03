import { useState, useCallback } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import ProposalList from './components/ProposalList'
import CSVUpload from './components/CSVUpload'
import AllocationPanel from './components/AllocationPanel'
import ResultsView from './components/ResultsView'
import SectorChart from './components/SectorChart'
import ComplianceDashboard from './components/ComplianceDashboard'
import ProjectTracker from './components/ProjectTracker'
import CSR2Form from './components/CSR2Form'
import LoginPage from './components/LoginPage'
import SignupPage from './components/SignupPage'
import ProfilePage from './components/ProfilePage'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function AppShell() {
  const { isAuthenticated } = useAuth()
  const [authView, setAuthView] = useState('login')

  if (!isAuthenticated) {
    return authView === 'login'
      ? <LoginPage onSwitchToSignup={() => setAuthView('signup')} />
      : <SignupPage onSwitchToLogin={() => setAuthView('login')} />
  }

  return <Dashboard />
}

function Dashboard() {
  const { user } = useAuth()
  const [proposals, setProposals] = useState([])
  const [budget, setBudget] = useState(user?.csr_budget || 500000)
  const [allocationResult, setAllocationResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [allocating, setAllocating] = useState(false)
  const [error, setError] = useState(null)
  const [activeView, setActiveView] = useState('proposals')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [constraints, setConstraints] = useState({
    min_regions: 2,
    min_sectors: 2,
    max_per_region_ratio: 0.5,
  })

  const loadSampleData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch(`${API_BASE}/proposals/sample`)
      if (!res.ok) throw new Error(`Failed to load sample data: ${res.statusText}`)
      setProposals(await res.json())
      setAllocationResult(null); setActiveView('proposals')
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }, [])

  const importCSV = useCallback(async (parsedRows) => {
    setLoading(true); setError(null)
    try {
      const res = await fetch(`${API_BASE}/proposals/bulk`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedRows),
      })
      if (!res.ok) throw new Error(`Bulk import failed: ${await res.text()}`)
      setProposals(await res.json())
      setAllocationResult(null); setActiveView('proposals')
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }, [])

  const runAllocation = useCallback(async () => {
    setAllocating(true); setError(null); setAllocationResult(null)
    try {
      const res = await fetch(`${API_BASE}/allocate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('csr_helper_token')}`,
        },
        body: JSON.stringify({ budget, proposals: proposals.map(p => p.id), constraints }),
      })
      if (!res.ok) throw new Error(`Allocation failed: ${await res.text()}`)
      setAllocationResult(await res.json()); setActiveView('results')
    } catch (err) { setError(err.message) } finally { setAllocating(false) }
  }, [budget, proposals, constraints])

  const resetAll = useCallback(() => {
    setProposals([]); setAllocationResult(null); setError(null); setActiveView('proposals')
  }, [])

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      <Header
        budget={budget} setBudget={setBudget}
        activeView={activeView} setActiveView={setActiveView}
        hasResults={!!allocationResult} hasProposals={proposals.length > 0}
        sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}
      />

      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar activeView={activeView} setActiveView={setActiveView} collapsed={!sidebarOpen} setCollapsed={setSidebarOpen} />

        {/* Main content */}
        <main className="flex-1 w-full min-w-0">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 lg:py-8">
            {/* Error banner */}
            {error && (
              <div className="mb-5 p-3.5 sm:p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2 animate-fade-in-up">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="min-w-0">{error}</span>
                <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600 flex-shrink-0 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {/* ── PROPOSALS VIEW ── */}
            {activeView === 'proposals' && (
              <div className="space-y-5 sm:space-y-6">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 sm:p-6 text-white shadow-lg animate-fade-in-up">
                  <h2 className="text-lg sm:text-xl font-bold">
                    Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.company_name || 'Company'} 👋
                  </h2>
                  <p className="text-blue-100 text-sm mt-1 max-w-xl">Upload proposals, score them, and run the ILP optimizer to find the best allocation.</p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                  <CSVUpload onImport={importCSV} disabled={loading} />
                  <button onClick={loadSampleData} disabled={loading} className="btn-primary !bg-emerald-600 !from-emerald-600 !to-emerald-600 hover:!from-emerald-700 hover:!to-emerald-700">
                    {loading ? 'Loading…' : 'Load Sample Data'}
                  </button>
                  {proposals.length > 0 && <button onClick={resetAll} className="btn-secondary">Clear All</button>}
                </div>

                {proposals.length > 0 ? (
                  <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5 sm:gap-6 items-start">
                    <ProposalList proposals={proposals} loading={loading} onLoadSample={loadSampleData} />
                    <div className="xl:sticky xl:top-20">
                      <AllocationPanel budget={budget} constraints={constraints} setConstraints={setConstraints}
                        onAllocate={runAllocation} allocating={allocating} proposalCount={proposals.length} />
                    </div>
                  </div>
                ) : (
                  <ProposalList proposals={proposals} loading={loading} onLoadSample={loadSampleData} />
                )}
              </div>
            )}

            {/* ── RESULTS VIEW ── */}
            {activeView === 'results' && (
              <div className="space-y-5 sm:space-y-6">
                <button onClick={() => setActiveView('proposals')}
                  className="flex items-center gap-2 text-slate-500 hover:text-slate-700 font-medium text-sm transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Proposals
                </button>
                {allocationResult && (
                  <>
                    <ResultsView result={allocationResult} proposals={proposals} budget={budget} />
                    <SectorChart result={allocationResult} proposals={proposals} />
                  </>
                )}
              </div>
            )}

            {/* ── COMPLIANCE VIEW ── */}
            {activeView === 'compliance' && <ComplianceDashboard budget={budget} />}

            {/* ── PROJECT TRACKER VIEW ── */}
            {activeView === 'projects' && <ProjectTracker />}

            {/* ── CSR-2 VIEW ── */}
            {activeView === 'csr2' && <CSR2Form />}

            {/* ── PROFILE VIEW ── */}
            {activeView === 'profile' && <ProfilePage />}
          </div>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  )
}
