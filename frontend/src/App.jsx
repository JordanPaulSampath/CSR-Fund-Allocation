import { useState, useCallback } from 'react'
import { AuthProvider, useAuth, authHeaders } from './context/AuthContext'
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

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function AppShell() {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <LoginPage />
  return <Dashboard />
}

function Dashboard() {
  const { user, token } = useAuth()
  const [proposals, setProposals] = useState([])
  const [budget, setBudget] = useState(500000)
  const [allocationResult, setAllocationResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [allocating, setAllocating] = useState(false)
  const [error, setError] = useState(null)
  const [activeView, setActiveView] = useState('proposals')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [constraints, setConstraints] = useState({
    min_regions: 2, min_sectors: 2, max_per_region_ratio: 0.5,
  })

  const authH = authHeaders(token)

  // ── Fetch all proposals ──
  const fetchProposals = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch(`${API}/proposals`)
      if (!res.ok) throw new Error(`Failed to fetch proposals`)
      setProposals(await res.json())
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }, [])

  // ── Load sample data (POST /proposals/load-samples) ──
  const loadSampleData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch(`${API}/proposals/load-samples?replace=true`, {
        method: 'POST', headers: { ...authH },
      })
      if (!res.ok) throw new Error(`Failed to load sample data: ${await res.text()}`)
      setProposals(await res.json()); setAllocationResult(null); setActiveView('proposals')
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }, [authH])

  // ── CSV upload (multipart POST /proposals/upload-csv) ──
  const uploadCSV = useCallback(async (file) => {
    setLoading(true); setError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`${API}/proposals/upload-csv?replace=true`, {
        method: 'POST', headers: { ...authH }, body: formData,
      })
      if (!res.ok) throw new Error(`Upload failed: ${await res.text()}`)
      setProposals(await res.json()); setAllocationResult(null); setActiveView('proposals')
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }, [authH])

  // ── Run allocation (POST /allocate?total_budget=N&strategy=optimizer) ──
  const runAllocation = useCallback(async (strategy = 'optimizer') => {
    setAllocating(true); setError(null); setAllocationResult(null)
    try {
      const res = await fetch(`${API}/allocate?total_budget=${budget}&strategy=${strategy}`, {
        method: 'POST', headers: { ...authH },
      })
      if (!res.ok) throw new Error(`Allocation failed: ${await res.text()}`)
      const data = await res.json()
      setAllocationResult(data)
      // Update proposals with funded/rejected status from allocation
      setProposals(prev => prev.map(p => {
        const funded = data.funded.find(f => f.id === p.id)
        if (funded) return { ...p, is_funded: true, allocated_amount: funded.allocated_amount }
        const rejected = data.rejected.find(r => r.id === p.id)
        if (rejected) return { ...p, is_funded: false, allocated_amount: 0 }
        return p
      }))
      setActiveView('results')
    } catch (err) { setError(err.message) } finally { setAllocating(false) }
  }, [budget, authH])

  // ── Compare strategies (POST /allocate/compare) ──
  const runCompare = useCallback(async () => {
    setAllocating(true); setError(null); setAllocationResult(null)
    try {
      const res = await fetch(`${API}/allocate/compare?total_budget=${budget}`, {
        method: 'POST', headers: { ...authH },
      })
      if (!res.ok) throw new Error(`Compare failed: ${await res.text()}`)
      const data = await res.json()
      setAllocationResult(data.optimizer)
      setProposals(prev => prev.map(p => {
        const funded = data.optimizer.funded.find(f => f.id === p.id)
        if (funded) return { ...p, is_funded: true, allocated_amount: funded.allocated_amount }
        return { ...p, is_funded: false, allocated_amount: 0 }
      }))
      setActiveView('results')
    } catch (err) { setError(err.message) } finally { setAllocating(false) }
  }, [budget, authH])

  // ── Reset all proposals ──
  const resetAll = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      await fetch(`${API}/proposals/reset`, { method: 'POST', headers: { ...authH } })
      setProposals([]); setAllocationResult(null); setActiveView('proposals')
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }, [authH])

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      <Header budget={budget} setBudget={setBudget} activeView={activeView}
        setActiveView={setActiveView} hasResults={!!allocationResult}
        hasProposals={proposals.length > 0} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex flex-1">
        <Sidebar activeView={activeView} setActiveView={setActiveView}
          collapsed={!sidebarOpen} setCollapsed={setSidebarOpen} />

        <main className="flex-1 w-full min-w-0">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 lg:py-8">
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

            {/* ── PROPOSALS ── */}
            {activeView === 'proposals' && (
              <div className="space-y-5 sm:space-y-6">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 sm:p-6 text-white shadow-lg animate-fade-in-up">
                  <h2 className="text-lg sm:text-xl font-bold">
                    Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.user || 'CSR Manager'} 👋
                  </h2>
                  <p className="text-blue-100 text-sm mt-1 max-w-xl">Upload NGO proposals, score them, and run the ILP optimizer to find the best allocation.</p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                  <CSVUpload onUpload={uploadCSV} disabled={loading} />
                  <button onClick={loadSampleData} disabled={loading}
                    className="btn-primary !bg-emerald-600 !from-emerald-600 !to-emerald-600 hover:!from-emerald-700 hover:!to-emerald-700">
                    {loading ? 'Loading…' : 'Load Sample Data'}
                  </button>
                  {proposals.length > 0 && (
                    <button onClick={resetAll} className="btn-secondary">Clear All</button>
                  )}
                </div>

                {proposals.length > 0 ? (
                  <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5 sm:gap-6 items-start">
                    <ProposalList proposals={proposals} loading={loading} onLoadSample={loadSampleData} />
                    <div className="xl:sticky xl:top-20">
                      <AllocationPanel budget={budget} constraints={constraints} setConstraints={setConstraints}
                        onAllocate={runAllocation} onCompare={runCompare} allocating={allocating}
                        proposalCount={proposals.length} />
                    </div>
                  </div>
                ) : (
                  <ProposalList proposals={proposals} loading={loading} onLoadSample={loadSampleData} />
                )}
              </div>
            )}

            {/* ── RESULTS ── */}
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

            {/* ── COMPLIANCE ── */}
            {activeView === 'compliance' && <ComplianceDashboard budget={budget} />}

            {/* ── PROJECT TRACKER ── */}
            {activeView === 'projects' && <ProjectTracker />}

            {/* ── CSR-2 ── */}
            {activeView === 'csr2' && <CSR2Form />}
          </div>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return <AuthProvider><AppShell /></AuthProvider>
}
