import { useEffect, useState, useCallback } from 'react'
import { auditLog, auditVerify } from '../services/api'

function money(n) {
  if (!n) return '₹0'
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`
  return `₹${Math.round(n).toLocaleString('en-IN')}`
}

const EVENT_LABEL = {
  allocation_run: 'Allocation run',
  proposal_funded: 'Proposal funded',
}

export default function AuditTrail() {
  const [entries, setEntries] = useState([])
  const [chk, setChk] = useState(null)
  const [err, setErr] = useState(null)

  const load = useCallback(() => {
    Promise.all([auditLog(), auditVerify()])
      .then(([e, v]) => { setEntries(e); setChk(v) })
      .catch((x) => setErr(x.message))
  }, [])

  useEffect(load, [load])

  if (err) return <p className="text-xs" style={{ color: 'var(--brick)' }}>{err}</p>

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl" style={{ color: 'var(--ink)' }}>Audit Trail</h1>
          <p className="text-xs mt-1" style={{ color: 'var(--stone)' }}>
            Every allocation decision, hash-chained. Each entry's hash covers the one before it —
            edit any past row and verification breaks.
          </p>
        </div>
        <button onClick={load} className="btn-secondary">Refresh</button>
      </div>

      {chk && (
        <div className="card p-4 flex items-center gap-3">
          <span className={chk.valid ? 'pill pill-ok' : 'pill'} style={chk.valid ? {} : { background: 'var(--brick)', color: '#fff' }}>
            {chk.valid ? 'Chain intact' : `Broken at #${chk.broken_at}`}
          </span>
          <span className="text-xs" style={{ color: 'var(--stone)' }}>{chk.entries} entries verified by re-hashing</span>
        </div>
      )}

      {!entries.length ? (
        <p className="text-xs" style={{ color: 'var(--stone)' }}>No events yet — run an allocation.</p>
      ) : (
        <div className="card overflow-hidden">
          <div className="register" style={{ borderTop: 'none' }}>
            {entries.slice().reverse().map((e) => (
              <div key={e.seq} className="register-row flex-col items-start gap-1">
                <div className="flex items-center gap-2 flex-wrap w-full">
                  <span className="pill pill-mute">#{e.seq}</span>
                  <span className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
                    {EVENT_LABEL[e.event] || e.event}
                  </span>
                  {e.event === 'proposal_funded' && (
                    <span className="text-xs" style={{ color: 'var(--stone)' }}>
                      {e.detail.title} — {money(e.detail.amount)} · {e.detail.region}
                    </span>
                  )}
                  {e.event === 'allocation_run' && (
                    <span className="text-xs" style={{ color: 'var(--stone)' }}>
                      {e.detail.strategy} · {money(e.detail.spent)} of {money(e.detail.total_budget)} · {e.detail.funded} funded
                    </span>
                  )}
                  <span className="text-[10px] ml-auto" style={{ color: 'var(--stone)' }}>{e.ts}</span>
                </div>
                <p className="text-[10px] font-mono truncate w-full" style={{ color: 'var(--stone)' }} title={e.entry_hash}>
                  {e.entry_hash.slice(0, 24)}… ← {e.prev_hash.slice(0, 12)}…
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
