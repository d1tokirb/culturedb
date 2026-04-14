import { collection, doc, getDoc, setDoc, getDocs, query, where, orderBy } from 'firebase/firestore'
import { db } from './firebase'
import type { WatchlistEntry, WatchStatus } from '@/types'

function watchlistDocId(userId: string, mediaId: string) {
  return `${userId}_${mediaId}`
}

export async function getWatchlistStatus(userId: string, mediaId: string): Promise<WatchStatus | null> {
  const snap = await getDoc(doc(db, 'watchlists', watchlistDocId(userId, mediaId)))
  return snap.exists() ? (snap.data() as WatchlistEntry).status : null
}

export async function setWatchlistEntry(
  userId: string, mediaId: string, status: WatchStatus, progressDetail = ''
): Promise<void> {
  await setDoc(doc(db, 'watchlists', watchlistDocId(userId, mediaId)), {
    user_id: userId, media_id: mediaId, status,
    progress_detail: progressDetail, updated_at: Date.now(),
  })
}

export async function getUserWatchlist(userId: string): Promise<WatchlistEntry[]> {
  const snap = await getDocs(
    query(collection(db, 'watchlists'), where('user_id', '==', userId), orderBy('updated_at', 'desc'))
  )
  return snap.docs.map((d) => d.data() as WatchlistEntry)
}

export async function getWatchlistByStatus(userId: string, status: WatchStatus): Promise<WatchlistEntry[]> {
  const snap = await getDocs(
    query(collection(db, 'watchlists'), where('user_id', '==', userId), where('status', '==', status), orderBy('updated_at', 'desc'))
  )
  return snap.docs.map((d) => d.data() as WatchlistEntry)
}
