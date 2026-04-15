'use client'

import { useEffect, useState } from 'react'
import { getUserSeasonRatings, submitRating } from '@/lib/ratings'
import type { Media, Rating } from '@/types'

interface Props {
  media: Media
  userId: string | null
}

export function SeasonRatings({ media, userId }: Props) {
  const [seasonRatings, setSeasonRatings] = useState<Rating[]>([])
  const [scores, setScores] = useState<Record<string, number>>({})
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({})

  const seasons = media.type === 'show' ? (media.metadata.seasons ?? []) : []

  useEffect(() => {
    if (!userId || seasons.length === 0) return
    getUserSeasonRatings(userId, media.id).then((ratings) => {
      setSeasonRatings(ratings)
      const initial: Record<string, number> = {}
      for (const r of ratings) {
        if (r.sub_id) initial[r.sub_id] = r.score
      }
      setScores(initial)
    })
  }, [userId, media.id, seasons.length])

  if (seasons.length === 0) return null

  const handleSubmit = async (seasonNum: number) => {
    if (!userId) return
    const subId = `s${seasonNum}`
    const score = scores[subId]
    if (!score) return
    setSubmitting((p) => ({ ...p, [subId]: true }))
    try {
      await submitRating({
        userId,
        mediaId: media.id,
        subId,
        score,
        status: 'completed',
      })
      const updated = await getUserSeasonRatings(userId, media.id)
      setSeasonRatings(updated)
    } finally {
      setSubmitting((p) => ({ ...p, [subId]: false }))
    }
  }

  return (
    <div className="mt-6 rounded-2xl p-5" style={{ backgroundColor: '#161618', border: '1px solid #2a2a2e' }}>
      <p className="text-xs uppercase tracking-widest mb-4" style={{ color: '#8a8a96' }}>
        Season Ratings
      </p>

      {!userId ? (
        <p className="text-sm" style={{ color: '#8a8a96' }}>Sign in to rate individual seasons</p>
      ) : (
        <div>
          {seasons.map((season) => {
            const subId = `s${season.season_num}`
            const existing = seasonRatings.find((r) => r.sub_id === subId)
            const inputScore = scores[subId] ?? existing?.score ?? ''
            return (
              <div
                key={season.season_num}
                className="flex items-center justify-between py-3"
                style={{ borderBottom: '1px solid #2a2a2e' }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm" style={{ color: '#f0ede8' }}>
                    Season {season.season_num}
                  </span>
                  {existing && (
                    <span className="text-sm font-semibold" style={{ color: '#e8a027' }}>
                      {existing.score}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={10}
                    step={0.5}
                    value={inputScore}
                    onChange={(e) =>
                      setScores((p) => ({ ...p, [subId]: parseFloat(e.target.value) }))
                    }
                    className="rounded-lg text-sm text-center"
                    style={{
                      width: '64px',
                      backgroundColor: '#0c0c0e',
                      border: '1px solid #2a2a2e',
                      color: '#f0ede8',
                      padding: '4px 6px',
                    }}
                  />
                  <button
                    onClick={() => handleSubmit(season.season_num)}
                    disabled={submitting[subId] || !scores[subId]}
                    className="py-1 px-3 rounded-lg text-xs font-semibold transition-colors"
                    style={{
                      backgroundColor: '#e8a027',
                      color: '#0c0c0e',
                      opacity: submitting[subId] || !scores[subId] ? 0.6 : 1,
                    }}
                  >
                    {submitting[subId] ? '...' : existing ? 'Update' : 'Rate'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
