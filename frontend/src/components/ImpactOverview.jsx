import { useMemo } from 'react'

function money(n) {
  if (!n) return '₹0'
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`
  return `₹${Math.round(n).toLocaleString('en-IN')}`
}

// Impact measurement view — reads the current allocation result + proposals.
export default function ImpactOverview({ result, proposals = [] }) {
  const m = useMemo(() => {
    const funded = result?.funded || proposals.filter((p) => p.is_funded)
    if (!funded.length) return null
    const spent = result?.spent || funded.reduce((a, p) => a + (p.requested_amount || 0), 0)
    const reach = funded.reduce((a, p) => a + (p.beneficiaries || 0), 0)
    const bySector = {}
    const byRegion = {}
    funded.forEach((p) => {
      bySector[p.sector] = (bySector[p.sector] || 0) + (p.beneficiaries || 0)
      byRegion[p.region] = (byRegion[p.region] || 0) + (p.beneficiaries || 0)
    })
    return {
      funded: funded.length,
      spent,
      reach,
      costPerBeneficiary: reach ? spent / reach : 0,
      avgScore: funded.reduce((a, p) => a + (p.final_score || 0), 0) / funded.length,
      sectors: Object.entries(bySector).sort((a, b) => b[1] - a[1]),
      regions: Object.entries(byRegion).sort((a, b) => b[1] - a[1]).slice(0, 8),
      regionCount: Object.keys(byRegion).length,
    }
  }, [result, proposals])

  if (!m) {
    return (
      <div className="animate-fade-in">
        <h1 className="text-xl" style={{ color: 'var(--ink)' }}>Impact Overview</h1>
        <p className="text-xs mt-2" style={{ color: 'var(--stone)' }}>Run an allocation to see projected impact.</p>
      </div>
    )
  }

  const maxSector = Math.max(...m.sectors.map((s) => s[1]), 1)

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl" style={{ color: 'var(--ink)' }}>Impact Overview</h1>
        <p className="text-xs mt-1" style={{ color: 'var(--stone)' }}>Projected reach of the current allocation.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px card overflow-hidden" style={{ background: 'var(--rule)' }}>
        {[
          ['Projects funded', m.funded],
          ['Beneficiaries', m.reach.toLocaleString('en-IN')],
          ['Cost / beneficiary', money(m.costPerBeneficiary)],
          ['Regions reached', m.regionCount],
        ].map(([k, v]) => (
          <div key={k} className="p-4" style={{ background: 'var(--paper)' }}>
            <p className="stat-label">{k}</p>
            <p className="stat-value mt-1">{v}</p>
          </div>
        ))}
      </div>

      <div className="card p-4">
        <p className="section-label mb-3">Beneficiaries by sector</p>
        <div className="space-y-2">
          {m.sectors.map(([name, val]) => (
            <div key={name} className="flex items-center gap-3">
              <span className="text-xs w-40 flex-shrink-0" style={{ color: 'var(--ink)' }}>{name}</span>
              <div className="flex-1 h-4 rounded overflow-hidden" style={{ background: 'var(--rule)' }}>
                <div className="h-full" style={{ width: `${(val / maxSector) * 100}%`, background: 'var(--petrol)' }} />
              </div>
              <span className="text-[10px] w-16 text-right tabular" style={{ color: 'var(--stone)' }}>{val.toLocaleString('en-IN')}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-4">
        <p className="section-label mb-3">Top regions by reach</p>
        <div className="flex flex-wrap gap-1.5">
          {m.regions.map(([name, val]) => (
            <span key={name} className="pill pill-mute">{name} · {val.toLocaleString('en-IN')}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
