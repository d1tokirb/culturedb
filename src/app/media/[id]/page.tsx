'use client'

import { useEffect, useState, Suspense } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { getMedia } from '@/lib/media'
import { submitRating, getUserRating } from '@/lib/ratings'
import { useAuth } from '@/context/AuthContext'
import { RatingTabs } from '@/components/media/RatingTabs'
import Image from 'next/image'
import { RatingModal } from '@/components/media/RatingModal'
import { WatchlistToggle } from '@/components/media/WatchlistToggle'
import type { Media, Rating, WatchStatus } from '@/types'

const TYPE_LABELS: Record<string, string> = {
  show: 'TV Show', movie: 'Movie', game: 'Game',
  album: 'Album', song: 'Song', person: 'Person',
}

function MediaDetailContent() {
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const { firebaseUser } = useAuth()
  const [media, setMedia] = useState<Media | null>(null)
  const [userRating, setUserRating] = useState<Rating | null>(null)
  const [ratingOpen, setRatingOpen] = useState(searchParams.get('rate') === 'true')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMedia(id).then((m) => {
      setMedia(m)
      setLoading(false)
    })
  }, [id])

  useEffect(() => {
    if (firebaseUser && id) {
      getUserRating(firebaseUser.uid, id).then(setUserRating)
    }
  }, [firebaseUser, id])

  const handleSubmitRating = async (payload: {
    score: number
    status: WatchStatus
    reviewText: string
    progressDetail: string
  }) => {
    if (!firebaseUser || !media) return
    await submitRating({
      userId: firebaseUser.uid,
      mediaId: media.id,
      score: payload.score,
      status: payload.status,
      reviewText: payload.reviewText,
      progressDetail: payload.progressDetail,
    })
    const updated = await getMedia(id)
    setMedia(updated)
    const updatedRating = await getUserRating(firebaseUser.uid, id)
    setUserRating(updatedRating)
  }

  if (loading) {
    return <p className="text-sm" style={{ color: '#8a8a96' }}>Loading...</p>
  }
  if (!media) {
    return <p style={{ color: '#8a8a96' }}>Media not found.</p>
  }

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex gap-6 mb-8">
        <div
          className="relative w-32 h-48 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
          style={{ backgroundColor: '#161618', border: '1px solid #2a2a2e' }}
        >
          {media.poster_url ? (
            <Image src={media.poster_url} alt={media.title} fill className="object-cover" />
          ) : (
            <span style={{ color: '#2a2a2e', fontSize: '32px' }}>▪</span>
          )}
        </div>
        <div className="flex-1 pt-2">
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#e8a027' }}>
            {TYPE_LABELS[media.type]}
          </p>
          <h1
            className="text-3xl mb-3 leading-tight"
            style={{ fontFamily: '"Playfair Display", serif', color: '#f0ede8' }}
          >
            {media.title}
          </h1>
          {media.description && (
            <p className="text-sm mb-4 leading-relaxed" style={{ color: '#8a8a96' }}>
              {media.description}
            </p>
          )}
          {firebaseUser && (
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => setRatingOpen(true)}
                className="py-2 px-5 rounded-lg text-sm font-semibold transition-colors"
                style={{ backgroundColor: '#e8a027', color: '#0c0c0e' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f0b035')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#e8a027')}
              >
                {userRating ? `Your rating: ${userRating.score}` : 'Rate this'}
              </button>
              <WatchlistToggle mediaId={id} />
            </div>
          )}
        </div>
      </div>

      {/* Score distribution */}
      <RatingTabs media={media} />

      {/* Metadata */}
      {Object.keys(media.metadata).length > 0 && (
        <div
          className="rounded-2xl p-5"
          style={{ backgroundColor: '#161618', border: '1px solid #2a2a2e' }}
        >
          <p className="text-xs uppercase tracking-widest mb-4" style={{ color: '#8a8a96' }}>
            Details
          </p>
          <dl className="grid grid-cols-2 gap-3">
            {media.metadata.release_year && (
              <>
                <dt className="text-xs" style={{ color: '#8a8a96' }}>Year</dt>
                <dd className="text-sm" style={{ color: '#f0ede8' }}>{media.metadata.release_year}</dd>
              </>
            )}
            {media.metadata.genre && (
              <>
                <dt className="text-xs" style={{ color: '#8a8a96' }}>Genre</dt>
                <dd className="text-sm" style={{ color: '#f0ede8' }}>{media.metadata.genre}</dd>
              </>
            )}
            {media.metadata.director && (
              <>
                <dt className="text-xs" style={{ color: '#8a8a96' }}>Director</dt>
                <dd className="text-sm" style={{ color: '#f0ede8' }}>{media.metadata.director}</dd>
              </>
            )}
            {media.metadata.creator && (
              <>
                <dt className="text-xs" style={{ color: '#8a8a96' }}>Creator</dt>
                <dd className="text-sm" style={{ color: '#f0ede8' }}>{media.metadata.creator}</dd>
              </>
            )}
            {media.metadata.artist && (
              <>
                <dt className="text-xs" style={{ color: '#8a8a96' }}>Artist</dt>
                <dd className="text-sm" style={{ color: '#f0ede8' }}>{media.metadata.artist}</dd>
              </>
            )}
            {media.metadata.studio && (
              <>
                <dt className="text-xs" style={{ color: '#8a8a96' }}>Studio</dt>
                <dd className="text-sm" style={{ color: '#f0ede8' }}>{media.metadata.studio}</dd>
              </>
            )}
            {media.metadata.platform && (
              <>
                <dt className="text-xs" style={{ color: '#8a8a96' }}>Platform</dt>
                <dd className="text-sm" style={{ color: '#f0ede8' }}>{media.metadata.platform}</dd>
              </>
            )}
          </dl>
        </div>
      )}

      {/* Rating modal */}
      <RatingModal
        open={ratingOpen}
        onClose={() => setRatingOpen(false)}
        media={media}
        initialScore={userRating?.score}
        initialStatus={userRating?.status}
        onSubmit={handleSubmitRating}
      />
    </div>
  )
}

export default function MediaDetailPage() {
  return (
    <Suspense fallback={<p className="text-sm" style={{ color: '#8a8a96' }}>Loading...</p>}>
      <MediaDetailContent />
    </Suspense>
  )
}
