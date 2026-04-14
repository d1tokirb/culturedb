'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface AffinityData { category: string; avg: number; count: number }
interface Props { data: AffinityData[] }

const CATEGORY_LABELS: Record<string, string> = {
  show: 'Shows', movie: 'Movies', game: 'Games',
  album: 'Albums', song: 'Songs', person: 'People',
}

export function CategoryAffinityChart({ data }: Props) {
  if (data.length === 0) return null

  const chartData = data
    .map((d) => ({ ...d, label: CATEGORY_LABELS[d.category] ?? d.category }))
    .sort((a, b) => b.avg - a.avg)

  return (
    <div>
      <p className="text-xs uppercase tracking-widest mb-4" style={{ color: '#8a8a96' }}>
        Category Affinity
      </p>
      <ResponsiveContainer width="100%" height={Math.max(80, chartData.length * 30)}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 32, top: 0, bottom: 0 }}>
          <XAxis type="number" domain={[0, 10]} tick={{ fontSize: 9, fill: '#8a8a96' }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: '#f0ede8' }} axisLine={false} tickLine={false} width={52} />
          <Tooltip
            cursor={{ fill: 'rgba(232,160,39,0.08)' }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const d = payload[0].payload as AffinityData & { label: string }
              return (
                <div className="px-2 py-1 text-xs rounded" style={{ backgroundColor: '#161618', border: '1px solid #2a2a2e', color: '#f0ede8' }}>
                  {d.label}: <strong>{d.avg.toFixed(1)}</strong> avg ({d.count} rated)
                </div>
              )
            }}
          />
          <Bar dataKey="avg" radius={[0, 3, 3, 0]}>
            {chartData.map((entry) => (
              <Cell key={entry.category} fill="#e8a027" fillOpacity={0.7 + (entry.avg / 10) * 0.3} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
