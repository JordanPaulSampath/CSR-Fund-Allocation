import { useState, useCallback } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import Header from './components/Header'
import ProposalList from './components/ProposalList'
import CSVUpload from './components/CSVUpload'
import AllocationPanel from './components/AllocationPanel'
import ResultsView from './components/ResultsView'
import SectorChart from './components/SectorChart'
import LoginPage from './components/LoginPage'
import SignupPage from './components/SignupPage'
import ProfilePage from './components/ProfilePage'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function AppShell() {
  const { isAuthenticated } = useAuth()
  const [authView, setAuthView] = useState('login') // 'login' | 'signup'

  // Not authenticated — show login/signup
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
  const [activeView, setActiveView] = useState('proposals') // 'proposals' | 'results' | 'profile'
  const [constraints, setConstraints] = useState({
    min_regions: 2,
    min_sectors: 2,
    max_per_region_ratio: 0.5,
  })

  // Bulk load sample data
  const loadSampleData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/proposals/sample`)
      if (!res.ok) throw new Error(`Failed to load sample data: ${res.statusText}`)
      const data = await res.json()
      setProposals(data)
      setAllocationResult(null)
      setActiveView('proposals')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Import proposals from CSV
  const importCSV = useCallback(async (parsedRows) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/proposals/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedRows),
      })
      if (!res.ok) {
        const errBody = await res.text()
        throw new Error(`Bulk import failed: ${errBody}`)
      }
      const data = await res.json()
      setProposals(data)
      setAllocationResult(null)
      setActiveView('proposals')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Add a single proposal
  const addProposal = useCallback(async (proposal) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/proposals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(proposal),
      })
      if (!res.ok) throw new Error(`Failed to add proposal: ${res.statusText}`)
      const data = await res.json()
      setProposals(prev => [...prev, data])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Run allocation
  const runAllocation = useCallback(async () => {
    setAllocating(true)
    setError(null)
    setAllocationResult(null)
    try {
      const res = await fetch(`${API_BASE}/allocate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('csr_helper_token')}`,
        },
        body: JSON.stringify({
          budget,
          proposals: proposals.map(p => p.id),
          constraints,
        }),
      })
      if (!res.ok) {
        const errBody = await res.text()
        throw new Error(`Allocation failed: ${errBody}`)
      }
      const data = await res.json()
      setAllocationResult(data)
      setActiveView('results')
    } catch (err) {
      setError(err.message)
    } finally {
      setAllocating(false)
    }
  }, [budget, proposals, constraints])

  // Clear everything
  const resetAll = useCallback(() => {
    setProposals([])
    setAllocationResult(null)
    setError(null)
    setActiveView('proposals')
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      <Header
        budget={budget}
        setBudget={setBudget}
        activeView={activeView}
        setActiveView={setActiveView}
        hasResults={!!allocationResult}
        hasProposals={proposals.length > 0}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Error banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2 animate-fade-in-up">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
            <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {activeView === 'profile' ? (
          <ProfilePage />
        ) : activeView === 'proposals' ? (
          <div className="space-y-6">
            {/* Welcome banner */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg animate-fade-in-up">
              <h2 className="text-lg font-bold">Welcome, {user?.company_name || 'Company'} 👋</h2>
              <p className="text-blue-100 text-sm mt-1">Upload proposals, score them, and run the ILP optimizer to find the best allocation.</p>
            </div>

            {/* Actions bar */}
            <div className="flex flex-wrap items-center gap-3">
              <CSVUpload onImport={importCSV} disabled={loading} />
              <button
                onClick={loadSampleData}
                disabled={loading}
                className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-medium text-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
              >
                {loading ? 'Loading…' : 'Load Sample Data'}
              </button>
              {proposals.length > 0 && (
                <button
                  onClick={resetAll}
                  className="px-4 py-2.5 bg-slate-200 text-slate-600 rounded-xl font-medium text-sm hover:bg-slate-300 transition-all"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Proposal List */}
            <ProposalList
              proposals={proposals}
              loading={loading}
              onLoadSample={loadSampleData}
            />

            {/* Allocation Panel */}
            {proposals.length > 0 && (
              <AllocationPanel
                budget={budget}
                constraints={constraints}
                setConstraints={setConstraints}
                onAllocate={runAllocation}
                allocating={allocating}
                proposalCount={proposals.length}
              />
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Back to proposals */}
            <button
              onClick={() => setActiveView('proposals')}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-700 font-medium text-sm transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Proposals
            </button>

            {allocationResult && (
              <>
                <ResultsView
                  result={allocationResult}
                  proposals={proposals}
                  budget={budget}
                />
                <SectorChart result={allocationResult} proposals={proposals} />
              </>
            )}
          </div>
        )}
      </main>
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
