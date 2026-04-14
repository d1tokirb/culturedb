import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, query, where, arrayUnion,
} from 'firebase/firestore'
import { db } from './firebase'
import { scoreToDistributionKey } from './ratings'
import { getUserRatings, getMediaByIds } from './profile'
import type { Group, Rating, ScoreDistribution } from '@/types'

export function generateInviteCode(): string {
  return Math.random().toString(36).slice(2, 10)
}

export function aggregateMemberRatings(ratings: Rating[]): {
  avg: number; count: number; distribution: ScoreDistribution
} {
  if (ratings.length === 0) return { avg: 0, count: 0, distribution: {} }
  const distribution: ScoreDistribution = {}
  let sum = 0
  for (const r of ratings) {
    sum += r.score
    const key = scoreToDistributionKey(r.score)
    distribution[key] = (distribution[key] ?? 0) + 1
  }
  return { avg: sum / ratings.length, count: ratings.length, distribution }
}

export async function createGroup(name: string, creatorUid: string): Promise<string> {
  const ref = await addDoc(collection(db, 'groups'), {
    name, created_by: creatorUid, members: [creatorUid],
    invite_code: generateInviteCode(), created_at: Date.now(),
  })
  await updateDoc(doc(db, 'users', creatorUid), { groups: arrayUnion(ref.id) })
  return ref.id
}

export async function getGroup(id: string): Promise<Group | null> {
  const snap = await getDoc(doc(db, 'groups', id))
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Group) : null
}

export async function getGroupByInviteCode(code: string): Promise<Group | null> {
  const snap = await getDocs(query(collection(db, 'groups'), where('invite_code', '==', code)))
  if (snap.empty) return null
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as Group
}

export async function joinGroup(groupId: string, uid: string): Promise<void> {
  await updateDoc(doc(db, 'groups', groupId), { members: arrayUnion(uid) })
  await updateDoc(doc(db, 'users', uid), { groups: arrayUnion(groupId) })
}

export async function getGroupRatingsForMedia(group: Group, mediaId: string): Promise<Rating[]> {
  const allRatings = await Promise.all(group.members.map((uid) => getUserRatings(uid)))
  return allRatings.flat().filter((r) => r.media_id === mediaId && r.sub_id === null)
}

export async function getUserGroups(groupIds: string[]): Promise<Group[]> {
  if (groupIds.length === 0) return []
  const results = await Promise.all(groupIds.map((id) => getGroup(id)))
  return results.filter((g): g is Group => g !== null)
}
