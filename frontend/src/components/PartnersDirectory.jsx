import { useEffect, useMemo, useState } from 'react'
import { listPartners } from '../services/api'

export default function PartnersDirectory() {
  const [partners, setPartners] = useState([])
  const [sector, setSector] = useState('')
  const [err, setErr] = useState(null)

  useEffect(() => {
    listPartners().then(setPartners).catch((e) => setErr(e.message))
  }, [])

  const sectors = useMemo(
    () => [...new Set(partners.flatMap((p) => p.sectors))].sort(),
    [partners],
  )
  const shown = sector ? partners.filter((p) => p.sectors.includes(sector)) : partners

  if (err) return <p className="text-xs" style={{ color: 'var(--brick)' }}>{err}</p>

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl" style={{ color: 'var(--ink)' }}>Partner Directory</h1>
        <p className="text-xs mt-1" style={{ color: 'var(--stone)' }}>
          {partners.length} implementing partners with capability profiles. Used by Partner Match to
          score fit against each funded proposal.
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <button onClick={() => setSector('')} className={sector === '' ? 'pill' : 'pill pill-mute'}>All</button>
        {sectors.map((s) => (
          <button key={s} onClick={() => setSector(s)} className={sector === s ? 'pill' : 'pill pill-mute'}>{s}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {shown.map((p) => (
          <div key={p.id} className="card p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{p.name}</p>
                <p className="text-[10px] mt-0.5 font-mono" style={{ color: 'var(--stone)' }}>{p.registration_no}</p>
              </div>
              <span className="pill pill-ok" title="on-time milestone rate">{Math.round(p.track_record * 100)}%</span>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {p.sectors.map((s) => <span key={s} className="pill pill-mute">{s}</span>)}
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3 pt-3" style={{ borderTop: '1px solid var(--rule)' }}>
              <div><p className="text-[9px] uppercase" style={{ color: 'var(--stone)' }}>Regions</p><p className="text-xs" style={{ color: 'var(--ink)' }}>{p.regions.length}</p></div>
              <div><p className="text-[9px] uppercase" style={{ color: 'var(--stone)' }}>Avg scale</p><p className="text-xs tabular" style={{ color: 'var(--ink)' }}>{p.avg_project_scale.toLocaleString('en-IN')}</p></div>
              <div><p className="text-[9px] uppercase" style={{ color: 'var(--stone)' }}>Cycles</p><p className="text-xs" style={{ color: 'var(--ink)' }}>{p.cycles_completed}</p></div>
            </div>
            <p className="text-[10px] mt-2" style={{ color: 'var(--stone)' }}>{p.regions.join(' · ')}</p>
            {p.contact && <p className="text-[10px] mt-1 font-mono" style={{ color: 'var(--petrol)' }}>{p.contact}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
