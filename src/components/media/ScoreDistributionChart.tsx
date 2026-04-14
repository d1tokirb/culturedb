'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { ScoreDistribution } from '@/types'

interface Props {
  distribution: ScoreDistribution
  avgScore: number
  ratingCount: number
}

export function ScoreDistributionChart({ distribution, avgScore, ratingCount }: Props) {
  const data = Object.entries(distribution)
    .sort(([a], [b]) => parseFloat(a) - parseFloat(b))
    .map(([score, count]) => ({ score, count }))

  return (
    <div className="w-full">
      <div className="flex items-baseline gap-2 mb-4">
        <span
          className="text-5xl font-bold"
          style={{ fontFamily: '"Playfair Display", serif', color: '#e8a027' }}
        >
          {avgScore.toFixed(1)}
        </span>
        <span className="text-sm" style={{ color: '#8a8a96' }}>
          {ratingCount} ratings
        </span>
      </div>
      <ResponsiveContainer width="100%" height={100}>
        <BarChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }} barCategoryGap="20%">
          <XAxis
            dataKey="score"
            tick={{ fontSize: 9, fill: '#8a8a96' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide />
          <Tooltip
            cursor={{ fill: 'rgba(232,160,39,0.08)' }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              return (
                <div
                  className="px-2 py-1 text-xs rounded"
                  style={{ backgroundColor: '#161618', border: '1px solid #2a2a2e', color: '#f0ede8' }}
                >
                  {payload[0].payload.score}: <strong>{payload[0].value}</strong>
                </div>
              )
            }}
          />
          <Bar dataKey="count" radius={[2, 2, 0, 0]}>
            {data.map((entry) => (
              <Cell
                key={entry.score}
                fill={parseFloat(entry.score) >= avgScore ? '#e8a027' : '#3a2e1a'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
