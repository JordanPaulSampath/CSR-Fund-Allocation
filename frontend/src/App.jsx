import { useState, useCallback, useEffect } from 'react'
import { AuthProvider, useAuth, authHeaders } from './context/AuthContext'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import ProposalList from './components/ProposalList'
import CSVUpload from './components/CSVUpload'
import AllocationPanel from './components/AllocationPanel'
import ResultsView from './components/ResultsView'
import SectorChart from './components/SectorChart'
import SummaryStats from './components/SummaryStats'
import ComplianceDashboard from './components/ComplianceDashboard'
import ProjectTracker from './components/ProjectTracker'
import CSR2Form from './components/CSR2Form'
import PartnerMatch from './components/PartnerMatch'
import BudgetAdvisor from './components/BudgetAdvisor'
import EquitySnapshot from './components/EquitySnapshot'
import ImpactOverview from './components/ImpactOverview'
import AuditTrail from './components/AuditTrail'
import DatasetSources from './components/DatasetSources'
import PartnersDirectory from './components/PartnersDirectory'
import LoginPage from './components/LoginPage'

// Same-origin by default: dev proxies these paths to :8000 (see vite.config.js),
// production serves them from the same FastAPI process that serves this bundle.
const API = import.meta.env.VITE_API_URL ?? ''

function AppShell() {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <LoginPage />
  return <Dashboard />
}

function Dashboard() {
  const { user, token } = useAuth()
  const [proposals, setProposals] = useState([])
  // start from this account's default CSR budget (varies per login)
  const [budget, setBudget] = useState(() => user?.default_budget || 5000000)
  const [budgetTouched, setBudgetTouched] = useState(false)
  const [allocationResult, setAllocationResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [allocating, setAllocating] = useState(false)
  const [error, setError] = useState(null)
  const [activeView, setActiveView] = useState('proposals')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [constraints, setConstraints] = useState({
    min_regions: 2, min_sectors: 2, max_per_region_ratio: 0.5,
  })
  const [apiUp, setApiUp] = useState(true)

  const authH = authHeaders(token)

  // adopt this account's default budget until the user edits it themselves
  useEffect(() => {
    if (!budgetTouched && user?.default_budget) setBudget(user.default_budget)
  }, [user?.default_budget, budgetTouched])

  const changeBudget = useCallback((v) => { setBudgetTouched(true); setBudget(v) }, [])

  useEffect(() => {
    let alive = true
    const ping = () => fetch(`${API}/health`)
      .then((r) => alive && setApiUp(r.ok))
      .catch(() => alive && setApiUp(false))
    ping()
    const id = setInterval(ping, 15000)
    return () => { alive = false; clearInterval(id) }
  }, [])

  const loadSampleData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch(`${API}/proposals/load-samples?replace=true`, { method: 'POST', headers: { ...authH } })
      if (!res.ok) throw new Error(`Failed to load: ${await res.text()}`)
      setProposals(await res.json()); setAllocationResult(null); setActiveView('proposals')
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }, [authH])

  const runAllocation = useCallback(async (strategy = 'optimizer', regionCap = null) => {
    setAllocating(true); setError(null); setAllocationResult(null)
    try {
      const capQ = regionCap ? `&max_per_region_ratio=${regionCap}` : ''
      const res = await fetch(`${API}/allocate?total_budget=${budget}&strategy=${strategy}${capQ}`, { method: 'POST', headers: { ...authH } })
      if (!res.ok) throw new Error(`Allocation failed: ${await res.text()}`)
      const data = await res.json()
      setAllocationResult(data)
      setProposals(prev => prev.map(p => {
        const f = data.funded.find(x => x.id === p.id)
        if (f) return { ...p, is_funded: true, allocated_amount: f.allocated_amount }
        return { ...p, is_funded: false, allocated_amount: 0 }
      }))
      setActiveView('results')
    } catch (err) { setError(err.message) } finally { setAllocating(false) }
  }, [budget, authH])

  const uploadCSV = useCallback(async (file) => {
    setLoading(true); setError(null)
    try {
      const fd = new FormData(); fd.append('file', file)
      const res = await fetch(`${API}/proposals/upload-csv?replace=true`, { method: 'POST', headers: { ...authH }, body: fd })
      if (!res.ok) throw new Error(`Upload failed: ${await res.text()}`)
      const rows = await res.json()
      setProposals(rows); setAllocationResult(null)
      // auto-run the optimiser on the freshly uploaded dataset
      if (rows.length) await runAllocation('optimizer')
      else setActiveView('proposals')
    } catch (err) { setError(err.message); setActiveView('proposals') } finally { setLoading(false) }
  }, [authH, runAllocation])

  const runCompare = useCallback(async () => {
    setAllocating(true); setError(null); setAllocationResult(null)
    try {
      const res = await fetch(`${API}/allocate/compare?total_budget=${budget}`, { method: 'POST', headers: { ...authH } })
      if (!res.ok) throw new Error(`Compare failed: ${await res.text()}`)
      const data = await res.json()
      setAllocationResult(data.optimizer)
      setProposals(prev => prev.map(p => {
        const f = data.optimizer.funded.find(x => x.id === p.id)
        if (f) return { ...p, is_funded: true, allocated_amount: f.allocated_amount }
        return { ...p, is_funded: false, allocated_amount: 0 }
      }))
      setActiveView('results')
    } catch (err) { setError(err.message) } finally { setAllocating(false) }
  }, [budget, authH])

  const resetAll = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      await fetch(`${API}/proposals/reset`, { method: 'POST', headers: { ...authH } })
      setProposals([]); setAllocationResult(null); setActiveView('proposals')
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }, [authH])

  return (
    <div className="min-h-screen" style={{ background: 'var(--parchment)' }}>
      <Header budget={budget} setBudget={changeBudget} activeView={activeView} apiUp={apiUp}
        setActiveView={setActiveView} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex">
        <Sidebar activeView={activeView} setActiveView={setActiveView}
          collapsed={!sidebarOpen} setCollapsed={setSidebarOpen} />

        <main className="flex-1 min-w-0">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {!apiUp && (
              <div className="mb-5 p-3 text-xs" style={{ background: 'rgba(156,107,48,0.08)', border: '1px solid rgba(156,107,48,0.3)', color: 'var(--brass)' }}>
                Can't reach the API. Make sure the backend is running — <span className="font-mono">python run.py</span> starts both.
              </div>
            )}
            {error && (
              <div className="mb-5 p-3 text-xs" style={{ background: 'rgba(178,59,59,0.06)', border: '1px solid rgba(178,59,59,0.2)', color: 'var(--brick)' }}>
                {error}
                <button onClick={() => setError(null)} className="ml-2 underline">dismiss</button>
              </div>
            )}

            {/* PROPOSALS */}
            {activeView === 'proposals' && (
              <div className="space-y-6">
                {/* Welcome */}
                <div>
                  <h1 className="font-serif text-xl" style={{ color: 'var(--ink)' }}>
                    Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.user || 'CSR Manager'}
                  </h1>
                  <p className="text-xs mt-1" style={{ color: 'var(--stone)' }}>
                    Load NGO proposals and run the optimizer to allocate your CSR budget.
                  </p>
                </div>

                <hr className="rule" />

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-3">
                  <CSVUpload onUpload={uploadCSV} disabled={loading || allocating} />
                  <button onClick={loadSampleData} disabled={loading} className="btn-primary">
                    {loading ? 'Loading…' : 'Load Sample Data'}
                  </button>
                  {proposals.length > 0 && <button onClick={resetAll} className="btn-secondary">Clear</button>}
                </div>
                <p className="text-[11px] -mt-3" style={{ color: 'var(--stone)' }}>
                  Uploading a CSV replaces the current set and runs the optimiser automatically.
                  Columns: <span className="font-mono">ngo_name, title, sector, region, requested_amount, beneficiaries</span>.
                </p>

                {proposals.length > 0 && <SummaryStats proposals={proposals} budget={budget} />}

                {proposals.length > 0 ? (
                  <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-6 items-start">
                    <ProposalList proposals={proposals} loading={loading} onLoadSample={loadSampleData} />
                    <div className="xl:sticky xl:top-16">
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

            {/* RESULTS */}
            {activeView === 'results' && (
              <div className="space-y-6">
                <button onClick={() => setActiveView('proposals')} className="text-xs" style={{ color: 'var(--stone)' }}>
                  ← Back to proposals
                </button>
                {allocationResult && (
                  <>
                    <ResultsView result={allocationResult} proposals={proposals} budget={budget} />
                    <BudgetAdvisor trigger={allocationResult} />
                    <SectorChart result={allocationResult} proposals={proposals} />
                  </>
                )}
              </div>
            )}

            {/* PARTNER MATCH */}
            {activeView === 'partners' && <PartnerMatch proposals={proposals} />}

            {/* EQUITY SNAPSHOT */}
            {activeView === 'equity' && <EquitySnapshot />}

            {/* IMPACT OVERVIEW */}
            {activeView === 'impact' && <ImpactOverview result={allocationResult} proposals={proposals} />}

            {/* PARTNER DIRECTORY */}
            {activeView === 'directory' && <PartnersDirectory />}

            {/* AUDIT TRAIL */}
            {activeView === 'audit' && <AuditTrail />}

            {/* DATASET & SOURCES */}
            {activeView === 'dataset' && <DatasetSources />}

            {/* COMPLIANCE */}
            {activeView === 'compliance' && <ComplianceDashboard budget={budget} />}

            {/* PROJECTS */}
            {activeView === 'projects' && <ProjectTracker />}

            {/* CSR-2 */}
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
