import { useEffect, useMemo, useState } from 'react'
import { matchPartners, listPartners } from '../services/api'

function formatCurrency(amount) {
  if (amount == null) return '—'
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`
  return `₹${Number(amount).toLocaleString('en-IN')}`
}

function FitBar({ value }) {
  const pct = Math.min(Math.max(value * 100, 0), 100)
  return (
    <div className="score-bar" style={{ width: 64 }}>
      <div className="score-bar-fill" style={{ width: `${pct}%` }} />
    </div>
  )
}

function CandidateCard({ c, rank }) {
  return (
    <div className="p-4" style={{ border: '1px solid var(--rule)', background: 'var(--paper)' }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
            {rank}. {c.name}
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--stone)' }}>
            {c.sectors.join(' · ')} — {c.regions.join(', ')}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-serif text-lg tabular" style={{ color: 'var(--petrol)' }}>{c.fit.toFixed(2)}</p>
          <FitBar value={c.fit} />
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mt-2">
        {c.badge && (
          <span className="text-[10px] px-1.5 py-0.5" style={{ background: 'rgba(138,133,120,0.12)', color: 'var(--stone)' }}>
            {c.badge}
          </span>
        )}
        {c.co_implementation_suggested && (
          <span className="text-[10px] px-1.5 py-0.5" style={{ background: 'rgba(156,107,48,0.12)', color: 'var(--brass)' }}>
            co-implementation suggested
          </span>
        )}
        {!c.unscored && (
          <span className="text-[10px] px-1.5 py-0.5" style={{ background: 'rgba(31,75,67,0.08)', color: 'var(--petrol)' }}>
            {Math.round(c.track_record * 100)}% on-time · {c.cycles_completed} cycles
          </span>
        )}
      </div>

      <p className="text-[11px] mt-2" style={{ color: 'var(--stone)' }}>{c.rationale}</p>

      <div className="grid grid-cols-4 gap-2 mt-3 pt-2" style={{ borderTop: '1px solid var(--rule)' }}>
        {Object.entries(c.components).map(([k, v]) => (
          <div key={k}>
            <p className="text-[9px] uppercase" style={{ color: 'var(--stone)', letterSpacing: '0.04em' }}>
              {k.replace(/_/g, ' ')}
            </p>
            <p className="font-serif text-xs tabular" style={{ color: 'var(--ink)' }}>{v.toFixed(2)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function PartnerMatch({ proposals = [] }) {
  const ranked = useMemo(
    () => [...proposals].sort((a, b) => {
      if (!!b.is_funded !== !!a.is_funded) return b.is_funded ? 1 : -1
      return (b.final_score || 0) - (a.final_score || 0)
    }),
    [proposals],
  )

  const [selectedId, setSelectedId] = useState(null)
  const [match, setMatch] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [directory, setDirectory] = useState([])

  useEffect(() => {
    listPartners().then(setDirectory).catch(() => setDirectory([]))
  }, [])

  useEffect(() => {
    if (!selectedId && ranked.length) setSelectedId(ranked[0].id)
  }, [ranked, selectedId])

  useEffect(() => {
    if (selectedId == null) return
    let alive = true
    setLoading(true)
    setError(null)
    setMatch(null)
    matchPartners(selectedId, 4)
      .then((m) => alive && setMatch(m))
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [selectedId])

  if (!proposals.length) {
    return (
      <div className="space-y-5 animate-fade-in">
        <h1 className="font-serif text-xl" style={{ color: 'var(--ink)' }}>Partner Match</h1>
        <p className="text-xs" style={{ color: 'var(--stone)' }}>
          Load proposals and run an allocation first — the shortlist ranks implementing
          partners against a funded proposal's sector, region and scale.
        </p>
        {directory.length > 0 && (
          <div>
            <p className="section-label mb-2">Implementing partner directory — {directory.length}</p>
            <div className="register">
              {directory.map((p) => (
                <div key={p.id} className="register-row">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{p.name}</p>
                    <p className="text-[10px]" style={{ color: 'var(--stone)' }}>{p.sectors.join(' · ')} — {p.regions.join(', ')}</p>
                  </div>
                  <span className="text-[10px]" style={{ color: 'var(--stone)' }}>{Math.round(p.track_record * 100)}% · {p.cycles_completed} cycles</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  const selected = ranked.find((p) => p.id === selectedId)

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="font-serif text-xl" style={{ color: 'var(--ink)' }}>Partner Match</h1>
        <p className="text-xs mt-1" style={{ color: 'var(--stone)' }}>
          Pillar 5 — a fit-scored implementing-partner shortlist per proposal.
          fit = 0.35·sector + 0.25·region + 0.20·capacity + 0.20·track record.
        </p>
      </div>

      <hr className="rule" />

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 items-start">
        {/* proposal picker */}
        <div>
          <p className="section-label mb-2">Proposal</p>
          <div className="register">
            {ranked.map((p) => {
              const active = p.id === selectedId
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  className="register-row w-full text-left cursor-pointer"
                  style={{ background: active ? 'rgba(31,75,67,0.05)' : 'transparent' }}
                >
                  <span style={{ width: 14, textAlign: 'center', color: p.is_funded ? 'var(--petrol)' : 'var(--stone)' }}>
                    {p.is_funded ? '✓' : '○'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm" style={{ color: 'var(--ink)', fontWeight: active ? 600 : 400 }}>{p.title}</p>
                    <p className="text-[10px]" style={{ color: 'var(--stone)' }}>{p.sector} · {p.region}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* shortlist */}
        <div className="space-y-3">
          {selected && (
            <div className="p-4" style={{ background: 'var(--paper)', border: '1px solid var(--rule)' }}>
              <p className="section-label mb-1">{selected.ngo_name} — submitting NGO</p>
              <h2 className="font-serif text-lg" style={{ color: 'var(--ink)' }}>{selected.title}</h2>
              <p className="text-xs mt-1" style={{ color: 'var(--stone)' }}>
                {selected.sector} · {selected.region} · {selected.beneficiaries?.toLocaleString('en-IN')} beneficiaries · {formatCurrency(selected.requested_amount)}
              </p>
            </div>
          )}

          {loading && <p className="text-xs" style={{ color: 'var(--stone)' }}>Scoring partners…</p>}
          {error && <p className="text-xs" style={{ color: 'var(--brick)' }}>{error}</p>}

          {match?.shortlist?.map((c, i) => (
            <CandidateCard key={c.partner_id} c={c} rank={i + 1} />
          ))}

          {match && (
            <p className="text-[10px] italic" style={{ color: 'var(--stone)' }}>{match.note}</p>
          )}
        </div>
      </div>
    </div>
  )
}
