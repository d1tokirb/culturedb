import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  runTransaction,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from './firebase'
import type { Media, MediaType, ScoreDistribution } from '@/types'

export function buildScoreDistribution(): ScoreDistribution {
  const dist: ScoreDistribution = {}
  for (let i = 1; i <= 10; i += 0.5) {
    dist[String(i)] = 0
  }
  return dist
}

export function computeNewAggregate(
  current: { avg: number; count: number },
  newScore: number,
  previousScore: number | null
): { avg: number; count: number } {
  if (previousScore !== null) {
    const totalWithout = current.avg * current.count - previousScore
    return {
      avg: (totalWithout + newScore) / current.count,
      count: current.count,
    }
  }
  const newCount = current.count + 1
  return {
    avg: (current.avg * current.count + newScore) / newCount,
    count: newCount,
  }
}

export async function getMedia(id: string): Promise<Media | null> {
  const snap = await getDoc(doc(db, 'media', id))
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Media) : null
}

export async function searchMedia(q: string, type?: MediaType): Promise<Media[]> {
  const lower = q.toLowerCase()
  let baseQuery = query(
    collection(db, 'media'),
    where('title_lower', '>=', lower),
    where('title_lower', '<=', lower + '\uf8ff'),
    limit(20)
  )
  if (type) {
    baseQuery = query(baseQuery, where('type', '==', type))
  }
  const snap = await getDocs(baseQuery)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Media))
}

export async function getRecentMedia(limitCount = 20): Promise<Media[]> {
  const snap = await getDocs(
    query(collection(db, 'media'), orderBy('created_at', 'desc'), limit(limitCount))
  )
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Media))
}

export async function uploadPoster(file: File, mediaId: string): Promise<string> {
  const storageRef = ref(storage, `posters/${mediaId}/${file.name}`)
  await uploadBytes(storageRef, file)
  return getDownloadURL(storageRef)
}

export async function createMedia(
  data: Omit<Media, 'id' | 'avg_score' | 'rating_count' | 'score_distribution'>,
  posterFile?: File
): Promise<string> {
  const docRef = await addDoc(collection(db, 'media'), {
    ...data,
    title_lower: data.title.toLowerCase(),
    avg_score: 0,
    rating_count: 0,
    score_distribution: buildScoreDistribution(),
  })

  if (posterFile) {
    const url = await uploadPoster(posterFile, docRef.id)
    await runTransaction(db, async (tx) => {
      tx.update(doc(db, 'media', docRef.id), { poster_url: url })
    })
  }

  return docRef.id
}
