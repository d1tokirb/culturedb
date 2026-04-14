'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getWatchlistStatus, setWatchlistEntry } from '@/lib/watchlist'
import type { WatchStatus } from '@/types'

interface Props { mediaId: string }

const STATUS_LABELS: Record<WatchStatus, string> = {
  want_to_watch: 'Want to Watch',
  in_progress: 'In Progress',
  completed: 'Completed',
}

export function WatchlistToggle({ mediaId }: Props) {
  const { firebaseUser } = useAuth()
  const [status, setStatus] = useState<WatchStatus | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!firebaseUser) return
    getWatchlistStatus(firebaseUser.uid, mediaId).then(setStatus)
  }, [firebaseUser, mediaId])

  if (!firebaseUser) return null

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as WatchStatus | ''
    if (!val) return
    setLoading(true)
    await setWatchlistEntry(firebaseUser.uid, mediaId, val as WatchStatus)
    setStatus(val as WatchStatus)
    setLoading(false)
  }

  return (
    <select
      value={status ?? ''}
      onChange={handleChange}
      disabled={loading}
      className="py-2 px-3 rounded-lg text-sm outline-none transition-all"
      style={{
        backgroundColor: '#161618',
        border: `1px solid ${status ? '#e8a027' : '#2a2a2e'}`,
        color: status ? '#e8a027' : '#8a8a96',
      }}
    >
      <option value="">+ Watchlist</option>
      {(Object.entries(STATUS_LABELS) as [WatchStatus, string][]).map(([val, label]) => (
        <option key={val} value={val}>{label}</option>
      ))}
    </select>
  )
}
