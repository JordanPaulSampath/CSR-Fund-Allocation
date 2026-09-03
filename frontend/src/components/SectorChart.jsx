import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

const COLORS = ['#1F4B43', '#9C6B30', '#8A8578', '#B23B3B', '#3B7A6E', '#6B5A3E', '#5A6B5E', '#8B6B4A']

function formatCurrency(amount) {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`
  return `₹${amount.toLocaleString('en-IN')}`
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div style={{ background: 'var(--paper)', border: '1px solid var(--rule)', padding: '8px 12px' }}>
      <p className="text-xs font-medium" style={{ color: 'var(--ink)' }}>{d.name}</p>
      <p className="font-serif text-sm tabular" style={{ color: 'var(--ink)' }}>{formatCurrency(d.value)}</p>
    </div>
  )
}

const CustomLegend = ({ payload }) => (
  <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-3">
    {payload?.map((entry, i) => (
      <div key={i} className="flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: entry.color }} />
        <span className="text-[10px]" style={{ color: 'var(--stone)' }}>{entry.value}</span>
      </div>
    ))}
  </div>
)

export default function SectorChart({ result, proposals }) {
  const funded = useMemo(() => result?.funded || [], [result])

  const sectorData = useMemo(() => {
    const map = {}
    funded.forEach(p => { map[p.sector] = (map[p.sector] || 0) + (p.requested_amount || 0) })
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  }, [funded])

  const regionData = useMemo(() => {
    const map = {}
    funded.forEach(p => { map[p.region] = (map[p.region] || 0) + (p.requested_amount || 0) })
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  }, [funded])

  if (sectorData.length === 0) return null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="p-5" style={{ background: 'var(--paper)', border: '1px solid var(--rule)' }}>
        <p className="section-label mb-4">Funded by Sector</p>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={sectorData} cx="50%" cy="45%" innerRadius="40%" outerRadius="70%"
              paddingAngle={2} dataKey="value" animationBegin={0} animationDuration={600}>
              {sectorData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="var(--paper)" strokeWidth={2} />)}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="p-5" style={{ background: 'var(--paper)', border: '1px solid var(--rule)' }}>
        <p className="section-label mb-4">Funded by Region</p>
        <div className="space-y-2">
          {regionData.map((r, i) => {
            const maxVal = regionData[0]?.value || 1
            const pct = (r.value / maxVal) * 100
            return (
              <div key={r.name} className="flex items-center gap-3">
                <span className="text-xs w-20 truncate" style={{ color: 'var(--stone)' }} title={r.name}>{r.name}</span>
                <div className="flex-1 h-4 overflow-hidden" style={{ background: 'var(--rule)' }}>
                  <div className="h-full" style={{ width: `${Math.max(pct, 5)}%`, background: COLORS[i % COLORS.length] }} />
                </div>
                <span className="font-serif text-[10px] tabular" style={{ color: 'var(--ink)', minWidth: '60px', textAlign: 'right' }}>
                  {formatCurrency(r.value)}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
