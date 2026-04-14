import {
  collection, query, where, getDocs, doc, updateDoc, arrayUnion, arrayRemove,
} from 'firebase/firestore'
import { db } from './firebase'
import type { User, Rating, Media, MediaType } from '@/types'

export async function getUserByUsername(username: string): Promise<User | null> {
  const q = query(collection(db, 'users'), where('username', '==', username))
  const snap = await getDocs(q)
  if (snap.empty) return null
  return { uid: snap.docs[0].id, ...snap.docs[0].data() } as User
}

export async function getUserRatings(userId: string): Promise<Rating[]> {
  const snap = await getDocs(
    query(collection(db, 'ratings'), where('user_id', '==', userId), where('sub_id', '==', null))
  )
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Rating))
}

export async function getMediaByIds(ids: string[]): Promise<Record<string, Media>> {
  if (ids.length === 0) return {}
  const chunks: string[][] = []
  for (let i = 0; i < ids.length; i += 30) chunks.push(ids.slice(i, i + 30))
  const results: Record<string, Media> = {}
  for (const chunk of chunks) {
    const snap = await getDocs(query(collection(db, 'media'), where('__name__', 'in', chunk)))
    snap.docs.forEach((d) => { results[d.id] = { id: d.id, ...d.data() } as Media })
  }
  return results
}

export function groupRatingsByCategory(
  ratings: Rating[],
  mediaMap: Record<string, Media>
): Partial<Record<MediaType, (Rating & { media: Media })[]>> {
  const groups: Partial<Record<MediaType, (Rating & { media: Media })[]>> = {}
  for (const rating of ratings) {
    if (rating.status !== 'completed') continue
    const media = mediaMap[rating.media_id]
    if (!media) continue
    if (!groups[media.type]) groups[media.type] = []
    groups[media.type]!.push({ ...rating, media })
  }
  for (const type of Object.keys(groups) as MediaType[]) {
    groups[type]!.sort((a, b) => b.score - a.score)
  }
  return groups
}

export function buildCategoryAffinityData(
  ratings: Rating[],
  mediaMap: Record<string, Media>
): { category: MediaType; avg: number; count: number }[] {
  const totals: Partial<Record<MediaType, { sum: number; count: number }>> = {}
  for (const rating of ratings) {
    if (rating.status !== 'completed') continue
    const media = mediaMap[rating.media_id]
    if (!media) continue
    if (!totals[media.type]) totals[media.type] = { sum: 0, count: 0 }
    totals[media.type]!.sum += rating.score
    totals[media.type]!.count += 1
  }
  return (Object.entries(totals) as [MediaType, { sum: number; count: number }][]).map(
    ([category, { sum, count }]) => ({ category, avg: sum / count, count })
  )
}

export async function followUser(currentUid: string, targetUid: string): Promise<void> {
  await updateDoc(doc(db, 'users', currentUid), { following: arrayUnion(targetUid) })
}

export async function unfollowUser(currentUid: string, targetUid: string): Promise<void> {
  await updateDoc(doc(db, 'users', currentUid), { following: arrayRemove(targetUid) })
}
