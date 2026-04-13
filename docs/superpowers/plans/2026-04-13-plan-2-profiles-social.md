# CultureDB — Plan 2: Profiles & Social

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build public profile pages with per-category ranked lists, watchlist/in-progress tracking UI, follow system, and category affinity stats.

**Architecture:** Extends Plan 1's Firestore collections. Profiles are server-rendered where possible (Next.js App Router). Watchlist state is managed in the `watchlists` collection. Follow relationships stored as arrays on user docs. Ranked lists are derived from the `ratings` collection filtered by user + status=completed, sorted by score.

**Tech Stack:** Next.js 14 (App Router), Firebase Firestore, Tailwind CSS (all from Plan 1)

**Prerequisite:** Plan 1 must be complete. All types, lib files, and Firebase setup from Plan 1 are assumed to exist.

---

## File Map

```
src/
├── app/
│   └── profile/
│       └── [username]/
│           └── page.tsx            # Public profile page
├── components/
│   ├── profile/
│   │   ├── RankedList.tsx          # Ordered list of media by user score
│   │   ├── CategoryAffinityChart.tsx  # Bar chart: avg score per category
│   │   ├── WatchlistSection.tsx    # Want to watch / In Progress / Completed tabs
│   │   └── FollowButton.tsx        # Follow/unfollow toggle
│   └── media/
│       └── WatchlistToggle.tsx     # Add/update watchlist status on media pages
├── lib/
│   ├── profile.ts                  # Fetch user by username, fetch their ratings
│   └── watchlist.ts                # Watchlist CRUD
└── __tests__/
    └── lib/
        ├── profile.test.ts
        └── watchlist.test.ts
```

---

## Task 1: Profile & Watchlist Libraries

**Files:**
- Create: `src/lib/profile.ts`
- Create: `src/lib/watchlist.ts`
- Create: `__tests__/lib/profile.test.ts`
- Create: `__tests__/lib/watchlist.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// __tests__/lib/profile.test.ts
import { groupRatingsByCategory, buildCategoryAffinityData } from '@/lib/profile'
import type { Rating, Media } from '@/types'

const makeRating = (mediaId: string, score: number): Rating => ({
  id: `r-${mediaId}`,
  user_id: 'u1',
  media_id: mediaId,
  sub_id: null,
  score,
  review_text: '',
  status: 'completed',
  progress_detail: '',
  created_at: 0,
  updated_at: 0,
})

const makeMedia = (id: string, type: Media['type'], title: string): Media => ({
  id,
  title,
  type,
  description: '',
  poster_url: '',
  created_by: 'u1',
  created_at: 0,
  metadata: {},
  avg_score: 0,
  rating_count: 0,
  score_distribution: {},
})

describe('groupRatingsByCategory', () => {
  it('groups ratings by media type, sorted by score descending', () => {
    const ratings = [makeRating('m1', 8.0), makeRating('m2', 9.5), makeRating('m3', 7.0)]
    const mediaMap: Record<string, Media> = {
      m1: makeMedia('m1', 'movie', 'Movie A'),
      m2: makeMedia('m2', 'movie', 'Movie B'),
      m3: makeMedia('m3', 'show', 'Show A'),
    }
    const result = groupRatingsByCategory(ratings, mediaMap)
    expect(result.movie).toHaveLength(2)
    expect(result.movie[0].score).toBe(9.5) // sorted desc
    expect(result.show).toHaveLength(1)
  })
})

describe('buildCategoryAffinityData', () => {
  it('returns avg score per category for use in bar chart', () => {
    const ratings = [makeRating('m1', 8.0), makeRating('m2', 6.0), makeRating('m3', 9.0)]
    const mediaMap: Record<string, Media> = {
      m1: makeMedia('m1', 'movie', 'Movie A'),
      m2: makeMedia('m2', 'movie', 'Movie B'),
      m3: makeMedia('m3', 'game', 'Game A'),
    }
    const result = buildCategoryAffinityData(ratings, mediaMap)
    const movie = result.find((d) => d.category === 'movie')
    const game = result.find((d) => d.category === 'game')
    expect(movie?.avg).toBeCloseTo(7.0)
    expect(game?.avg).toBeCloseTo(9.0)
  })
})
```

```typescript
// __tests__/lib/watchlist.test.ts
import { getWatchlistStatus } from '@/lib/watchlist'

// getWatchlistStatus returns null when no entry exists — we test the pure logic part
describe('getWatchlistStatus', () => {
  it('is a function that accepts userId and mediaId', () => {
    expect(typeof getWatchlistStatus).toBe('function')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest __tests__/lib/profile.test.ts __tests__/lib/watchlist.test.ts --no-coverage
```
Expected: FAIL — modules not found.

- [ ] **Step 3: Write profile.ts**

```typescript
// src/lib/profile.ts
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
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
    query(
      collection(db, 'ratings'),
      where('user_id', '==', userId),
      where('sub_id', '==', null)
    )
  )
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Rating))
}

export async function getMediaByIds(ids: string[]): Promise<Record<string, Media>> {
  if (ids.length === 0) return {}
  // Firestore 'in' queries support up to 30 items; chunk if needed
  const chunks: string[][] = []
  for (let i = 0; i < ids.length; i += 30) {
    chunks.push(ids.slice(i, i + 30))
  }
  const results: Record<string, Media> = {}
  for (const chunk of chunks) {
    const snap = await getDocs(
      query(collection(db, 'media'), where('__name__', 'in', chunk))
    )
    snap.docs.forEach((d) => {
      results[d.id] = { id: d.id, ...d.data() } as Media
    })
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
  await updateDoc(doc(db, 'users', currentUid), {
    following: arrayUnion(targetUid),
  })
}

export async function unfollowUser(currentUid: string, targetUid: string): Promise<void> {
  await updateDoc(doc(db, 'users', currentUid), {
    following: arrayRemove(targetUid),
  })
}
```

- [ ] **Step 4: Write watchlist.ts**

```typescript
// src/lib/watchlist.ts
import {
  collection,
  doc,
  getDoc,
  setDoc,
  getDocs,
  query,
  where,
  orderBy,
} from 'firebase/firestore'
import { db } from './firebase'
import type { WatchlistEntry, WatchStatus } from '@/types'

function watchlistDocId(userId: string, mediaId: string) {
  return `${userId}_${mediaId}`
}

export async function getWatchlistStatus(
  userId: string,
  mediaId: string
): Promise<WatchStatus | null> {
  const snap = await getDoc(doc(db, 'watchlists', watchlistDocId(userId, mediaId)))
  return snap.exists() ? (snap.data() as WatchlistEntry).status : null
}

export async function setWatchlistEntry(
  userId: string,
  mediaId: string,
  status: WatchStatus,
  progressDetail = ''
): Promise<void> {
  await setDoc(doc(db, 'watchlists', watchlistDocId(userId, mediaId)), {
    user_id: userId,
    media_id: mediaId,
    status,
    progress_detail: progressDetail,
    updated_at: Date.now(),
  })
}

export async function getUserWatchlist(userId: string): Promise<WatchlistEntry[]> {
  const snap = await getDocs(
    query(
      collection(db, 'watchlists'),
      where('user_id', '==', userId),
      orderBy('updated_at', 'desc')
    )
  )
  return snap.docs.map((d) => d.data() as WatchlistEntry)
}

export async function getWatchlistByStatus(
  userId: string,
  status: WatchStatus
): Promise<WatchlistEntry[]> {
  const snap = await getDocs(
    query(
      collection(db, 'watchlists'),
      where('user_id', '==', userId),
      where('status', '==', status),
      orderBy('updated_at', 'desc')
    )
  )
  return snap.docs.map((d) => d.data() as WatchlistEntry)
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx jest __tests__/lib/profile.test.ts __tests__/lib/watchlist.test.ts --no-coverage
```
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add src/lib/profile.ts src/lib/watchlist.ts __tests__/lib/profile.test.ts __tests__/lib/watchlist.test.ts
git commit -m "feat: add profile and watchlist Firestore libraries"
```

---

## Task 2: Follow Button Component

**Files:**
- Create: `src/components/profile/FollowButton.tsx`

- [ ] **Step 1: Write FollowButton.tsx**

```typescript
// src/components/profile/FollowButton.tsx
'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { followUser, unfollowUser } from '@/lib/profile'

interface Props {
  targetUid: string
}

export function FollowButton({ targetUid }: Props) {
  const { firebaseUser, userDoc } = useAuth()

  const isFollowing = userDoc?.following.includes(targetUid) ?? false
  const [optimistic, setOptimistic] = useState<boolean | null>(null)
  const following = optimistic ?? isFollowing

  if (!firebaseUser || firebaseUser.uid === targetUid) return null

  const toggle = async () => {
    setOptimistic(!following)
    try {
      if (following) {
        await unfollowUser(firebaseUser.uid, targetUid)
      } else {
        await followUser(firebaseUser.uid, targetUid)
      }
    } catch {
      setOptimistic(following) // revert on error
    }
  }

  return (
    <button
      onClick={toggle}
      className={`py-1.5 px-4 rounded-full text-sm font-medium transition border ${
        following
          ? 'bg-white text-gray-700 border-gray-300 hover:border-red-400 hover:text-red-500'
          : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
      }`}
    >
      {following ? 'Following' : 'Follow'}
    </button>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/profile/FollowButton.tsx
git commit -m "feat: add follow/unfollow button with optimistic UI"
```

---

## Task 3: Watchlist Toggle (on Media Pages)

**Files:**
- Create: `src/components/media/WatchlistToggle.tsx`

- [ ] **Step 1: Write WatchlistToggle.tsx**

```typescript
// src/components/media/WatchlistToggle.tsx
'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getWatchlistStatus, setWatchlistEntry } from '@/lib/watchlist'
import type { WatchStatus } from '@/types'

interface Props {
  mediaId: string
}

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
      className={`py-1.5 px-3 rounded-lg text-sm border transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
        status ? 'border-blue-400 text-blue-700 bg-blue-50' : 'border-gray-300 text-gray-600'
      }`}
    >
      <option value="">+ Watchlist</option>
      {(Object.entries(STATUS_LABELS) as [WatchStatus, string][]).map(([val, label]) => (
        <option key={val} value={val}>{label}</option>
      ))}
    </select>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/media/WatchlistToggle.tsx
git commit -m "feat: add watchlist toggle dropdown for media pages"
```

---

## Task 4: Ranked List Component

**Files:**
- Create: `src/components/profile/RankedList.tsx`

- [ ] **Step 1: Write RankedList.tsx**

```typescript
// src/components/profile/RankedList.tsx
import Link from 'next/link'
import type { Rating, Media } from '@/types'

interface Props {
  items: (Rating & { media: Media })[]
  category: string
}

const CATEGORY_LABELS: Record<string, string> = {
  show: 'TV Shows',
  movie: 'Movies',
  game: 'Games',
  album: 'Albums',
  song: 'Songs',
  person: 'People',
}

export function RankedList({ items, category }: Props) {
  if (items.length === 0) return null

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        {CATEGORY_LABELS[category] ?? category}
      </h3>
      <ol className="flex flex-col gap-2">
        {items.map((item, i) => (
          <li key={item.id} className="flex items-center gap-3">
            <span className="text-xs text-gray-400 w-5 text-right shrink-0">{i + 1}</span>
            {item.media.poster_url && (
              <img
                src={item.media.poster_url}
                alt={item.media.title}
                className="w-8 h-10 object-cover rounded shrink-0"
              />
            )}
            <Link
              href={`/media/${item.media_id}`}
              className="flex-1 text-sm text-gray-900 hover:text-blue-600 truncate"
            >
              {item.media.title}
            </Link>
            <span className="text-sm font-semibold text-blue-600 shrink-0">
              {item.score.toFixed(1)}
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/profile/RankedList.tsx
git commit -m "feat: add ranked list component for profile page"
```

---

## Task 5: Category Affinity Chart

**Files:**
- Create: `src/components/profile/CategoryAffinityChart.tsx`

- [ ] **Step 1: Write CategoryAffinityChart.tsx**

```typescript
// src/components/profile/CategoryAffinityChart.tsx
'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface AffinityData {
  category: string
  avg: number
  count: number
}

interface Props {
  data: AffinityData[]
}

const CATEGORY_LABELS: Record<string, string> = {
  show: 'Shows',
  movie: 'Movies',
  game: 'Games',
  album: 'Albums',
  song: 'Songs',
  person: 'People',
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1']

export function CategoryAffinityChart({ data }: Props) {
  if (data.length === 0) return null

  const chartData = data
    .map((d) => ({ ...d, label: CATEGORY_LABELS[d.category] ?? d.category }))
    .sort((a, b) => b.avg - a.avg)

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        Category Affinity
      </h3>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 32, top: 0, bottom: 0 }}>
          <XAxis type="number" domain={[0, 10]} tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="label" tick={{ fontSize: 12, fill: '#374151' }} axisLine={false} tickLine={false} width={50} />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const d = payload[0].payload as AffinityData & { label: string }
              return (
                <div className="bg-white border border-gray-200 rounded px-2 py-1 text-xs shadow">
                  {d.label}: {d.avg.toFixed(1)} avg ({d.count} rated)
                </div>
              )
            }}
          />
          <Bar dataKey="avg" radius={[0, 3, 3, 0]}>
            {chartData.map((entry, i) => (
              <Cell key={entry.category} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/profile/CategoryAffinityChart.tsx
git commit -m "feat: add category affinity horizontal bar chart"
```

---

## Task 6: Watchlist Section Component

**Files:**
- Create: `src/components/profile/WatchlistSection.tsx`

- [ ] **Step 1: Write WatchlistSection.tsx**

```typescript
// src/components/profile/WatchlistSection.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { WatchlistEntry, Media, WatchStatus } from '@/types'

interface Props {
  entries: WatchlistEntry[]
  mediaMap: Record<string, Media>
}

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
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        Watchlist
      </h3>
      <div className="flex gap-2 mb-4">
        {TABS.map((tab) => {
          const count = entries.filter((e) => e.status === tab.value).length
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`py-1 px-3 rounded-full text-xs font-medium border transition ${
                activeTab === tab.value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
              }`}
            >
              {tab.label} {count > 0 && <span className="opacity-70">({count})</span>}
            </button>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-gray-400">Nothing here yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {filtered.map((entry) => {
            const media = mediaMap[entry.media_id]
            if (!media) return null
            return (
              <li key={entry.media_id} className="flex items-center gap-3">
                {media.poster_url && (
                  <img
                    src={media.poster_url}
                    alt={media.title}
                    className="w-8 h-10 object-cover rounded shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/media/${entry.media_id}`}
                    className="text-sm text-gray-900 hover:text-blue-600 truncate block"
                  >
                    {media.title}
                  </Link>
                  {entry.progress_detail && (
                    <p className="text-xs text-gray-400">{entry.progress_detail}</p>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/profile/WatchlistSection.tsx
git commit -m "feat: add watchlist section with in-progress/want-to-watch/completed tabs"
```

---

## Task 7: Profile Page

**Files:**
- Create: `src/app/profile/[username]/page.tsx`
- Modify: `src/app/media/[id]/page.tsx` — add WatchlistToggle

- [ ] **Step 1: Write profile page**

```typescript
// src/app/profile/[username]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import {
  getUserByUsername,
  getUserRatings,
  getMediaByIds,
  groupRatingsByCategory,
  buildCategoryAffinityData,
} from '@/lib/profile'
import { getUserWatchlist } from '@/lib/watchlist'
import { RankedList } from '@/components/profile/RankedList'
import { CategoryAffinityChart } from '@/components/profile/CategoryAffinityChart'
import { WatchlistSection } from '@/components/profile/WatchlistSection'
import { FollowButton } from '@/components/profile/FollowButton'
import type { User, Rating, Media, MediaType, WatchlistEntry } from '@/types'

const CATEGORY_ORDER: MediaType[] = ['show', 'movie', 'game', 'album', 'song', 'person']

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>()
  const { firebaseUser } = useAuth()

  const [profileUser, setProfileUser] = useState<User | null>(null)
  const [ratings, setRatings] = useState<Rating[]>([])
  const [mediaMap, setMediaMap] = useState<Record<string, Media>>({})
  const [watchlist, setWatchlist] = useState<WatchlistEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const load = async () => {
      const user = await getUserByUsername(username)
      if (!user) { setNotFound(true); setLoading(false); return }
      setProfileUser(user)

      const [userRatings, userWatchlist] = await Promise.all([
        getUserRatings(user.uid),
        getUserWatchlist(user.uid),
      ])
      setRatings(userRatings)
      setWatchlist(userWatchlist)

      const allMediaIds = Array.from(
        new Set([
          ...userRatings.map((r) => r.media_id),
          ...userWatchlist.map((w) => w.media_id),
        ])
      )
      const map = await getMediaByIds(allMediaIds)
      setMediaMap(map)
      setLoading(false)
    }
    load()
  }, [username])

  if (loading) return <p className="text-gray-400 text-sm">Loading...</p>
  if (notFound) return <p className="text-gray-500">User not found.</p>
  if (!profileUser) return null

  const grouped = groupRatingsByCategory(ratings, mediaMap)
  const affinityData = buildCategoryAffinityData(ratings, mediaMap)
  const completedCount = ratings.filter((r) => r.status === 'completed').length

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        {profileUser.avatar_url ? (
          <img
            src={profileUser.avatar_url}
            alt={profileUser.username}
            className="w-16 h-16 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-2xl font-bold shrink-0">
            {profileUser.username[0].toUpperCase()}
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">@{profileUser.username}</h1>
            <FollowButton targetUid={profileUser.uid} />
          </div>
          {profileUser.bio && (
            <p className="text-gray-500 text-sm mt-1">{profileUser.bio}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">{completedCount} ratings</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left: ranked lists */}
        <div className="md:col-span-2 flex flex-col gap-8">
          {CATEGORY_ORDER.filter((cat) => grouped[cat]?.length).map((cat) => (
            <RankedList key={cat} items={grouped[cat]!} category={cat} />
          ))}
          {Object.keys(grouped).length === 0 && (
            <p className="text-gray-400 text-sm">No ratings yet.</p>
          )}
        </div>

        {/* Right: affinity chart + watchlist */}
        <div className="flex flex-col gap-8">
          {affinityData.length > 0 && <CategoryAffinityChart data={affinityData} />}
          <WatchlistSection entries={watchlist} mediaMap={mediaMap} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add WatchlistToggle to media detail page**

In `src/app/media/[id]/page.tsx`, add the import and component next to the Rate button:

```typescript
// Add import at top:
import { WatchlistToggle } from '@/components/media/WatchlistToggle'

// Add inside the button group (next to the Rate button):
<WatchlistToggle mediaId={id} />
```

- [ ] **Step 3: Commit**

```bash
git add src/app/profile/ src/app/media/
git commit -m "feat: add public profile page with ranked lists, affinity chart, and watchlist"
```

---

## Task 8: Smoke Test & Manual Verification

- [ ] **Step 1: Run all tests**

```bash
npx jest --no-coverage
```
Expected: All tests PASS.

- [ ] **Step 2: Start dev server and verify manually**

```bash
npm run dev
```

Verify:
1. After signing in, navigate to `/profile/[your-username]` — profile loads
2. Ranked lists appear per category after rating items
3. Category affinity chart shows average scores per category
4. Watchlist toggle appears on media detail pages
5. Changing watchlist status updates the profile watchlist section
6. In Progress items show progress detail (set via rating modal)
7. Follow button appears on other users' profiles
8. Following a user updates the Following count on the auth user's doc

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: plan 2 complete — profiles and social"
```
