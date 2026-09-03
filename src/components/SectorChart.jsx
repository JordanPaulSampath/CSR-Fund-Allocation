import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316', '#6366f1', '#14b8a6']

function formatCurrency(amount) {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`
  return `₹${amount.toLocaleString('en-IN')}`
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl px-3 py-2 shadow-lg">
      <p className="text-sm font-semibold text-slate-800">{d.name}</p>
      <p className="text-xs text-slate-500">{formatCurrency(d.value)}</p>
    </div>
  )
}

const CustomLegend = ({ payload }) => (
  <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-3">
    {payload?.map((entry, i) => (
      <div key={i} className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: entry.color }} />
        <span className="text-[11px] text-slate-600">{entry.value}</span>
      </div>
    ))}
  </div>
)

export default function SectorChart({ result, proposals }) {
  const proposalMap = useMemo(() => {
    const map = {}
    proposals.forEach(p => { map[p.id] = p })
    return map
  }, [proposals])

  const funded = useMemo(() => {
    if (!result?.funded) return []
    return result.funded.map(id => proposalMap[id]).filter(Boolean)
  }, [result, proposalMap])

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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 animate-fade-in-up">
      {/* Sector Breakdown */}
      <div className="card p-5 sm:p-6">
        <h3 className="section-title mb-4">Funded by Sector</h3>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={sectorData}
              cx="50%"
              cy="45%"
              innerRadius="40%"
              outerRadius="70%"
              paddingAngle={3}
              dataKey="value"
              animationBegin={0}
              animationDuration={800}
            >
              {sectorData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="white" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Region Breakdown */}
      <div className="card p-5 sm:p-6">
        <h3 className="section-title mb-4">Funded by Region</h3>
        <div className="space-y-2.5">
          {regionData.map((r, i) => {
            const maxVal = regionData[0]?.value || 1
            const pct = (r.value / maxVal) * 100
            return (
              <div key={r.name} className="flex items-center gap-2.5 sm:gap-3">
                <span className="text-xs font-medium text-slate-600 w-20 sm:w-24 truncate flex-shrink-0" title={r.name}>{r.name}</span>
                <div className="flex-1 h-5 sm:h-6 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out flex items-center justify-end pr-2"
                    style={{ width: `${Math.max(pct, 10)}%`, backgroundColor: COLORS[i % COLORS.length] }}
                  >
                    {pct > 25 && (
                      <span className="text-[10px] font-bold text-white drop-shadow-sm">{formatCurrency(r.value)}</span>
                    )}
                  </div>
                </div>
                {pct <= 25 && (
                  <span className="text-[10px] font-medium text-slate-500 flex-shrink-0">{formatCurrency(r.value)}</span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
