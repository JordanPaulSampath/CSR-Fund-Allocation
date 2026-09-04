import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { spring } from '../lib/motion'
import SpringNumber from './SpringNumber'
import { useAuth } from '../context/AuthContext'

const VIEW_LABELS = {
  proposals: 'Proposals', results: 'Settlement', partners: 'Partner Match',
  equity: 'Equity Snapshot', impact: 'Impact Overview', directory: 'Partner Directory',
  audit: 'Audit Trail', dataset: 'Dataset & Sources',
  compliance: 'Compliance', csr2: 'CSR-2 Filing', projects: 'Project Tracker',
}

const fmtBudget = (n) => {
  if (n >= 10000000) return `${(n / 10000000).toFixed(2)} Cr`
  if (n >= 100000) return `${(n / 100000).toFixed(1)} L`
  return Math.round(n).toLocaleString('en-IN')
}

export default function Header({ budget, setBudget, activeView, apiUp = true, sidebarOpen, setSidebarOpen }) {
  const { user, logout } = useAuth()
  const [editing, setEditing] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])

  return (
    <header className="sticky top-0 z-50" style={{ background: 'var(--paper)', borderBottom: '1px solid var(--rule)' }}>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between" style={{ height: '52px' }}>
          {/* Left: toggle + title + breadcrumb */}
          <div className="flex items-center gap-3">
            <motion.button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5"
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} transition={spring.micro}
              style={{ color: 'var(--stone)' }} aria-label="Toggle sidebar">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                {sidebarOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  : <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />}
              </svg>
            </motion.button>
            <span className="font-serif text-base font-semibold" style={{ color: 'var(--ink)' }}>Saarthi</span>
            <AnimatePresence mode="wait">
              {VIEW_LABELS[activeView] && (
                <motion.span key={activeView} className="hidden sm:flex items-center gap-3"
                  initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 6 }}
                  transition={spring.micro}>
                  <span className="text-xs" style={{ color: 'var(--rule)' }}>/</span>
                  <span className="section-label">{VIEW_LABELS[activeView]}</span>
                </motion.span>
              )}
            </AnimatePresence>
            <span className="flex items-center ml-1" title={apiUp ? 'API connected' : 'API unreachable'}>
              <motion.span className="w-1.5 h-1.5 rounded-full" style={{ background: apiUp ? 'var(--teal)' : 'var(--brick)' }}
                animate={apiUp ? { scale: [1, 1.35, 1], opacity: [1, 0.6, 1] } : { scale: 1, opacity: 1 }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }} />
            </span>
          </div>

          {/* Center: Budget — click to edit, glides when it changes */}
          <div className="hidden sm:flex items-center gap-3">
            <span className="section-label">Budget</span>
            {editing ? (
              <input ref={inputRef} type="number" value={budget}
                onChange={(e) => setBudget(Number(e.target.value) || 0)}
                onBlur={() => setEditing(false)}
                onKeyDown={(e) => { if (e.key === 'Enter') setEditing(false) }}
                className="font-serif text-lg pl-2 pr-2 py-0.5 text-right tabular"
                style={{ background: 'transparent', border: 'none', borderBottom: '2px solid var(--petrol)',
                  color: 'var(--ink)', width: '150px', outline: 'none' }} />
            ) : (
              <motion.button onClick={() => setEditing(true)}
                whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }} transition={spring.micro}
                className="font-serif text-lg tabular flex items-baseline gap-0.5"
                style={{ borderBottom: '2px solid var(--brass)', color: 'var(--ink)', paddingBottom: 2 }}
                title="Click to edit">
                <span className="text-sm" style={{ color: 'var(--stone)' }}>₹</span>
                <SpringNumber value={budget} format={fmtBudget} level="story" />
              </motion.button>
            )}
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            {user && (
              <span className="text-xs hidden sm:block" style={{ color: 'var(--stone)' }}>
                {user.company_name || user.user}
              </span>
            )}
            <button onClick={logout} className="btn-ghost text-xs">Sign Out</button>
          </div>
        </div>
      </div>
    </header>
  )
}
