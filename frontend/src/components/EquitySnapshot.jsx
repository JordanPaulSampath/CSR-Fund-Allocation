import { useEffect, useState } from 'react'
import { districtSaturation } from '../services/api'

function money(n) {
  if (!n) return '₹0'
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`
  return `₹${Math.round(n).toLocaleString('en-IN')}`
}

// Pillar 1 — where the money landed by region, against each region's
// development-need index. Concentration in low-need regions is the thing the
// equity-constrained optimizer exists to push back on.
export default function EquitySnapshot() {
  const [rows, setRows] = useState([])
  const [err, setErr] = useState(null)

  useEffect(() => {
    districtSaturation().then(setRows).catch((e) => setErr(e.message))
  }, [])

  if (err) return <p className="text-xs" style={{ color: 'var(--brick)' }}>{err}</p>
  if (!rows.length) return <p className="text-xs" style={{ color: 'var(--stone)' }}>Load proposals to see the regional picture.</p>

  const maxReq = Math.max(...rows.map((r) => r.requested), 1)
  const anyFunded = rows.some((r) => r.funded_amount > 0)
  const totalFunded = rows.reduce((a, r) => a + r.funded_amount, 0)
  const highNeedShare = totalFunded
    ? rows.filter((r) => (r.need_index ?? r.district_need_index ?? 55) >= 60)
        .reduce((a, r) => a + r.funded_amount, 0) / totalFunded
    : 0

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl" style={{ color: 'var(--ink)' }}>Equity Snapshot</h1>
        <p className="text-xs mt-1" style={{ color: 'var(--stone)' }}>
          Regional distribution of requested vs funded amounts, ranked by ask.
          Need index (0–100) is the NITI Aayog SDG development gap — higher means more under-served.
        </p>
      </div>

      {anyFunded && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-px card overflow-hidden" style={{ background: 'var(--rule)' }}>
          <div className="p-4" style={{ background: 'var(--paper)' }}>
            <p className="stat-label">Regions funded</p>
            <p className="stat-value mt-1">{rows.filter((r) => r.funded_amount > 0).length}<span className="text-sm" style={{ color: 'var(--stone)' }}> / {rows.length}</span></p>
          </div>
          <div className="p-4" style={{ background: 'var(--paper)' }}>
            <p className="stat-label">Total funded</p>
            <p className="stat-value mt-1">{money(totalFunded)}</p>
          </div>
          <div className="p-4" style={{ background: 'var(--paper)' }}>
            <p className="stat-label">To high-need regions</p>
            <p className="stat-value mt-1">{(highNeedShare * 100).toFixed(0)}%</p>
          </div>
        </div>
      )}

      <div className="card p-4">
        <div className="space-y-3">
          {rows.map((r) => {
            const need = r.need_index ?? r.district_need_index ?? 55
            const reqPct = (r.requested / maxReq) * 100
            const fundPct = r.requested ? (r.funded_amount / r.requested) * 100 : 0
            return (
              <div key={r.region} className="flex items-center gap-3">
                <span className="text-xs w-28 flex-shrink-0 truncate" style={{ color: 'var(--ink)' }} title={r.region}>{r.region}</span>
                <div className="flex-1 h-5 rounded relative overflow-hidden" style={{ background: 'var(--rule)', width: `${Math.max(reqPct, 6)}%` }}>
                  <div className="h-full" style={{ width: `${fundPct}%`, background: 'var(--teal)' }} />
                </div>
                <span className="text-[10px] w-16 text-right tabular" style={{ color: 'var(--stone)' }}>{money(r.requested)}</span>
                <span className="pill pill-mute w-10 justify-center" title="development-need index">{need}</span>
              </div>
            )
          })}
        </div>
        <p className="text-[10px] mt-3" style={{ color: 'var(--stone)' }}>
          Bar length = amount requested (relative). Teal fill = share of that request funded.
        </p>
      </div>
    </div>
  )
}
