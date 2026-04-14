import {
  collection,
  doc,
  query,
  where,
  getDocs,
  runTransaction,
} from 'firebase/firestore'
import { db } from './firebase'
import { computeNewAggregate } from './media'
import type { Rating, WatchStatus } from '@/types'

export function scoreToDistributionKey(score: number): string {
  const rounded = Math.round(score * 2) / 2
  const clamped = Math.min(10, Math.max(1, rounded))
  return String(clamped)
}

export async function getUserRating(
  userId: string,
  mediaId: string,
  subId: string | null = null
): Promise<Rating | null> {
  const q = query(
    collection(db, 'ratings'),
    where('user_id', '==', userId),
    where('media_id', '==', mediaId),
    where('sub_id', '==', subId)
  )
  const snap = await getDocs(q)
  if (snap.empty) return null
  const d = snap.docs[0]
  return { id: d.id, ...d.data() } as Rating
}

export async function submitRating({
  userId,
  mediaId,
  subId = null,
  score,
  reviewText = '',
  status,
  progressDetail = '',
}: {
  userId: string
  mediaId: string
  subId?: string | null
  score: number
  reviewText?: string
  status: WatchStatus
  progressDetail?: string
}): Promise<void> {
  const existing = await getUserRating(userId, mediaId, subId)
  const now = Date.now()
  const bucket = scoreToDistributionKey(score)

  await runTransaction(db, async (tx) => {
    const mediaRef = doc(db, 'media', mediaId)
    const mediaSnap = await tx.get(mediaRef)
    if (!mediaSnap.exists()) throw new Error('Media not found')

    const mediaData = mediaSnap.data()
    const { avg, count } = computeNewAggregate(
      { avg: mediaData.avg_score, count: mediaData.rating_count },
      score,
      existing?.score ?? null
    )

    const dist = { ...mediaData.score_distribution }
    if (existing) {
      const oldBucket = scoreToDistributionKey(existing.score)
      dist[oldBucket] = Math.max(0, (dist[oldBucket] ?? 0) - 1)
    }
    dist[bucket] = (dist[bucket] ?? 0) + 1

    tx.update(mediaRef, {
      avg_score: avg,
      rating_count: count,
      score_distribution: dist,
    })

    if (existing) {
      tx.update(doc(db, 'ratings', existing.id), {
        score,
        review_text: reviewText,
        status,
        progress_detail: progressDetail,
        updated_at: now,
      })
    } else {
      const newRatingRef = doc(collection(db, 'ratings'))
      tx.set(newRatingRef, {
        user_id: userId,
        media_id: mediaId,
        sub_id: subId,
        score,
        review_text: reviewText,
        status,
        progress_detail: progressDetail,
        created_at: now,
        updated_at: now,
      })
    }
  })
}

export async function getMediaRatings(mediaId: string): Promise<Rating[]> {
  const snap = await getDocs(
    query(
      collection(db, 'ratings'),
      where('media_id', '==', mediaId),
      where('sub_id', '==', null)
    )
  )
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Rating))
}
