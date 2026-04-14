'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { WatchlistEntry, Media, WatchStatus } from '@/types'

interface Props { entries: WatchlistEntry[]; mediaMap: Record<string, Media> }

const TABS: { value: WatchStatus; label: string }[] = [
  { value: 'in_progress', label: 'In Progress' },
  { value: 'want_to_watch', label: 'Want to Watch' },
  { value: 'completed', label: 'Completed' },
]

export function WatchlistSection({ entries, mediaMap }: Props) {
  const [activeTab, setActiveTab] = useState<WatchStatus>('in_progress')
  const filtered = entries.filter((e) => e.status === activeTab)

  return (
    <div>
      <p className="text-xs uppercase tracking-widest mb-4" style={{ color: '#8a8a96' }}>Watchlist</p>
      <div className="flex gap-2 mb-4 flex-wrap">
        {TABS.map((tab) => {
          const count = entries.filter((e) => e.status === tab.value).length
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className="py-0.5 px-3 rounded-full text-xs font-medium transition-colors"
              style={{
                backgroundColor: activeTab === tab.value ? '#e8a027' : '#161618',
                color: activeTab === tab.value ? '#0c0c0e' : '#8a8a96',
                border: `1px solid ${activeTab === tab.value ? '#e8a027' : '#2a2a2e'}`,
              }}
            >
              {tab.label}{count > 0 && ` (${count})`}
            </button>
          )
        })}
      </div>
      {filtered.length === 0 ? (
        <p className="text-xs" style={{ color: '#3a3a3e' }}>Nothing here yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {filtered.map((entry) => {
            const media = mediaMap[entry.media_id]
            if (!media) return null
            return (
              <li key={entry.media_id} className="flex items-center gap-3">
                <Link href={`/media/${entry.media_id}`} className="flex-1 text-sm truncate transition-colors"
                  style={{ color: '#f0ede8' }}
                  onMouseEnter={(e: any) => (e.currentTarget.style.color = '#e8a027')}
                  onMouseLeave={(e: any) => (e.currentTarget.style.color = '#f0ede8')}
                >
                  {media.title}
                </Link>
                {entry.progress_detail && (
                  <span className="text-xs shrink-0" style={{ color: '#8a8a96' }}>{entry.progress_detail}</span>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
