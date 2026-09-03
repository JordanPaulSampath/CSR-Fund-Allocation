import { useEffect, useState } from 'react'
import { datasetInfo, datasetCsvUrl } from '../services/api'

export default function DatasetSources() {
  const [info, setInfo] = useState(null)
  const [err, setErr] = useState(null)

  useEffect(() => {
    datasetInfo().then(setInfo).catch((e) => setErr(e.message))
  }, [])

  if (err) return <p className="text-xs" style={{ color: 'var(--brick)' }}>{err}</p>
  if (!info) return null

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl" style={{ color: 'var(--ink)' }}>Dataset &amp; Sources</h1>
        <p className="text-xs mt-1 max-w-2xl" style={{ color: 'var(--stone)' }}>{info.methodology}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px card overflow-hidden" style={{ background: 'var(--rule)' }}>
        {[
          ['Rows', info.rows],
          ['Loaded now', info.loaded_rows],
          ['Columns', info.schema.length],
          ['Sources', info.sources.length],
        ].map(([k, v]) => (
          <div key={k} className="p-4" style={{ background: 'var(--paper)' }}>
            <p className="stat-label">{k}</p>
            <p className="stat-value mt-1">{v}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <a href={datasetCsvUrl} download className="btn-primary" style={{ textDecoration: 'none' }}>Download CSV</a>
        <a href={info.github} target="_blank" rel="noopener" className="btn-secondary" style={{ textDecoration: 'none' }}>View on GitHub</a>
      </div>

      <div className="card p-4">
        <p className="section-label mb-2">Schema</p>
        <div className="flex flex-wrap gap-1.5">
          {info.schema.map((c) => <span key={c} className="pill pill-mute font-mono">{c}</span>)}
        </div>
      </div>

      <div className="card p-4">
        <p className="section-label mb-2">Calibration facts (FY 2022–23)</p>
        <ul className="space-y-1.5">
          {info.calibration_facts.map((f, i) => (
            <li key={i} className="text-xs flex gap-2" style={{ color: 'var(--ink)' }}>
              <span style={{ color: 'var(--petrol)' }}>•</span>{f}
            </li>
          ))}
        </ul>
      </div>

      <div className="card overflow-hidden">
        <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--rule)' }}>
          <p className="section-label">Trusted official sources</p>
        </div>
        <div className="register" style={{ borderTop: 'none' }}>
          {info.sources.map((s, i) => (
            <div key={i} className="register-row flex-col items-start gap-1">
              <div className="flex items-center gap-2 flex-wrap">
                <a href={s.url} target="_blank" rel="noopener" className="text-sm font-medium hover-underline" style={{ color: 'var(--petrol)' }}>
                  {s.title}
                </a>
                <span className="pill pill-mute">{s.publisher}</span>
              </div>
              <p className="text-[11px]" style={{ color: 'var(--stone)' }}>Used for: {s.used_for}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
