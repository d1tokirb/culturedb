# CultureDB — Plan 3: Groups & Data

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build friend groups (create, join via invite link, group pages) and add group + friend rating overlay tabs to media pages.

**Architecture:** Groups are Firestore documents with a `members` array and a unique `invite_code`. The group page aggregates ratings from all members client-side (fetching member ratings in parallel). Media pages get two new tabs: "Friends" (ratings from followed users) and "Groups" (per-group overlay) rendered as overlaid bar charts using Recharts.

**Tech Stack:** Next.js 14 (App Router), Firebase Firestore, Tailwind CSS, Recharts (all from Plan 1)

**Prerequisite:** Plans 1 and 2 must be complete.

---

## File Map

```
src/
├── app/
│   └── groups/
│       ├── new/page.tsx                  # Create a group
│       └── [id]/page.tsx                 # Group detail page
├── components/
│   ├── groups/
│   │   ├── CreateGroupForm.tsx
│   │   ├── GroupCard.tsx                 # Summary card linking to group page
│   │   └── GroupRatingChart.tsx          # Overlaid bar chart for group ratings
│   └── media/
│       └── RatingTabs.tsx                # All / Friends / Groups tab switcher on media pages
├── lib/
│   └── groups.ts                         # Group CRUD and rating aggregation
└── __tests__/
    └── lib/
        └── groups.test.ts
```

---

## Task 1: Groups Library

**Files:**
- Create: `src/lib/groups.ts`
- Create: `__tests__/lib/groups.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// __tests__/lib/groups.test.ts
import { generateInviteCode, aggregateMemberRatings } from '@/lib/groups'
import type { Rating } from '@/types'

describe('generateInviteCode', () => {
  it('returns a string of 8 alphanumeric characters', () => {
    const code = generateInviteCode()
    expect(typeof code).toBe('string')
    expect(code).toHaveLength(8)
    expect(/^[a-z0-9]+$/.test(code)).toBe(true)
  })

  it('generates different codes each call', () => {
    const a = generateInviteCode()
    const b = generateInviteCode()
    expect(a).not.toBe(b)
  })
})

describe('aggregateMemberRatings', () => {
  it('computes avg and distribution from multiple members ratings', () => {
    const ratings: Rating[] = [
      { id: '1', user_id: 'u1', media_id: 'm1', sub_id: null, score: 8.0, review_text: '', status: 'completed', progress_detail: '', created_at: 0, updated_at: 0 },
      { id: '2', user_id: 'u2', media_id: 'm1', sub_id: null, score: 6.0, review_text: '', status: 'completed', progress_detail: '', created_at: 0, updated_at: 0 },
    ]
    const result = aggregateMemberRatings(ratings)
    expect(result.avg).toBeCloseTo(7.0)
    expect(result.count).toBe(2)
    expect(result.distribution['8']).toBe(1)
    expect(result.distribution['6']).toBe(1)
  })

  it('returns zeros for empty ratings array', () => {
    const result = aggregateMemberRatings([])
    expect(result.avg).toBe(0)
    expect(result.count).toBe(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest __tests__/lib/groups.test.ts --no-coverage
```
Expected: FAIL — module not found.

- [ ] **Step 3: Write groups.ts**

```typescript
// src/lib/groups.ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  arrayUnion,
} from 'firebase/firestore'
import { db } from './firebase'
import { scoreToDistributionKey } from './ratings'
import { getUserRatings } from './profile'
import type { Group, Rating, ScoreDistribution } from '@/types'

export function generateInviteCode(): string {
  return Math.random().toString(36).slice(2, 10)
}

export function aggregateMemberRatings(ratings: Rating[]): {
  avg: number
  count: number
  distribution: ScoreDistribution
} {
  if (ratings.length === 0) {
    return { avg: 0, count: 0, distribution: {} }
  }
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
    name,
    created_by: creatorUid,
    members: [creatorUid],
    invite_code: generateInviteCode(),
    created_at: Date.now(),
  })
  // Add group to creator's user doc
  await updateDoc(doc(db, 'users', creatorUid), {
    groups: arrayUnion(ref.id),
  })
  return ref.id
}

export async function getGroup(id: string): Promise<Group | null> {
  const snap = await getDoc(doc(db, 'groups', id))
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Group) : null
}

export async function getGroupByInviteCode(code: string): Promise<Group | null> {
  const snap = await getDocs(
    query(collection(db, 'groups'), where('invite_code', '==', code))
  )
  if (snap.empty) return null
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as Group
}

export async function joinGroup(groupId: string, uid: string): Promise<void> {
  await updateDoc(doc(db, 'groups', groupId), {
    members: arrayUnion(uid),
  })
  await updateDoc(doc(db, 'users', uid), {
    groups: arrayUnion(groupId),
  })
}

export async function getGroupRatingsForMedia(
  group: Group,
  mediaId: string
): Promise<Rating[]> {
  // Fetch ratings for each member in parallel, filter for this media
  const allRatings = await Promise.all(
    group.members.map((uid) => getUserRatings(uid))
  )
  return allRatings
    .flat()
    .filter((r) => r.media_id === mediaId && r.sub_id === null)
}

export async function getUserGroups(groupIds: string[]): Promise<Group[]> {
  if (groupIds.length === 0) return []
  const results = await Promise.all(groupIds.map((id) => getGroup(id)))
  return results.filter((g): g is Group => g !== null)
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest __tests__/lib/groups.test.ts --no-coverage
```
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/groups.ts __tests__/lib/groups.test.ts
git commit -m "feat: add groups library with invite codes and member rating aggregation"
```

---

## Task 2: Create Group Form & Page

**Files:**
- Create: `src/components/groups/CreateGroupForm.tsx`
- Create: `src/app/groups/new/page.tsx`

- [ ] **Step 1: Write CreateGroupForm.tsx**

```typescript
// src/components/groups/CreateGroupForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { createGroup } from '@/lib/groups'

export function CreateGroupForm() {
  const { firebaseUser } = useAuth()
  const router = useRouter()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!firebaseUser) return
    const trimmed = name.trim()
    if (!trimmed) { setError('Group name required'); return }
    setLoading(true)
    try {
      const id = await createGroup(trimmed, firebaseUser.uid)
      router.push(`/groups/${id}`)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-sm">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
        <input
          type="text"
          placeholder="e.g. The Crew"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="py-2 px-5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
      >
        {loading ? 'Creating...' : 'Create Group'}
      </button>
    </form>
  )
}
```

- [ ] **Step 2: Write /groups/new page**

```typescript
// src/app/groups/new/page.tsx
import { CreateGroupForm } from '@/components/groups/CreateGroupForm'

export default function NewGroupPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create a Group</h1>
      <CreateGroupForm />
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/groups/CreateGroupForm.tsx src/app/groups/new/page.tsx
git commit -m "feat: add create group form and page"
```

---

## Task 3: Group Detail Page

**Files:**
- Create: `src/components/groups/GroupRatingChart.tsx`
- Create: `src/app/groups/[id]/page.tsx`

- [ ] **Step 1: Write GroupRatingChart.tsx**

```typescript
// src/components/groups/GroupRatingChart.tsx
'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { ScoreDistribution } from '@/types'

interface Props {
  distribution: ScoreDistribution
  avg: number
  count: number
  label: string
}

export function GroupRatingChart({ distribution, avg, count, label }: Props) {
  if (count === 0) return <p className="text-sm text-gray-400">No ratings from this group yet.</p>

  const data = Object.entries(distribution)
    .sort(([a], [b]) => parseFloat(a) - parseFloat(b))
    .map(([score, c]) => ({ score, count: c }))

  return (
    <div>
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-2xl font-bold text-gray-900">{avg.toFixed(1)}</span>
        <span className="text-gray-400 text-sm">{label} avg · {count} ratings</span>
      </div>
      <ResponsiveContainer width="100%" height={100}>
        <BarChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <XAxis dataKey="score" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <YAxis hide />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              return (
                <div className="bg-white border border-gray-200 rounded px-2 py-1 text-xs shadow">
                  Score {payload[0].payload.score}: {payload[0].value}
                </div>
              )
            }}
          />
          <Bar dataKey="count" radius={[2, 2, 0, 0]}>
            {data.map((entry) => (
              <Cell
                key={entry.score}
                fill={parseFloat(entry.score) >= avg ? '#8b5cf6' : '#c4b5fd'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 2: Write /groups/[id] page**

```typescript
// src/app/groups/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { getGroup, joinGroup, getGroupByInviteCode } from '@/lib/groups'
import { getMediaByIds } from '@/lib/profile'
import { getUserRatings } from '@/lib/profile'
import { aggregateMemberRatings } from '@/lib/groups'
import { GroupRatingChart } from '@/components/groups/GroupRatingChart'
import type { Group, Media, Rating } from '@/types'
import Link from 'next/link'

export default function GroupPage() {
  const { id } = useParams<{ id: string }>()
  const { firebaseUser, userDoc } = useAuth()
  const router = useRouter()

  const [group, setGroup] = useState<Group | null>(null)
  const [topMedia, setTopMedia] = useState<{ media: Media; avg: number; count: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [joining, setJoining] = useState(false)

  const isMember = userDoc?.groups.includes(id) ?? false

  useEffect(() => {
    const load = async () => {
      const g = await getGroup(id)
      if (!g) { setNotFound(true); setLoading(false); return }
      setGroup(g)

      // Aggregate all member ratings across all media
      const allRatings = await Promise.all(g.members.map((uid) => getUserRatings(uid)))
      const flat = allRatings.flat().filter((r) => r.sub_id === null)

      // Group by media_id and find top rated
      const byMedia: Record<string, Rating[]> = {}
      for (const r of flat) {
        if (!byMedia[r.media_id]) byMedia[r.media_id] = []
        byMedia[r.media_id].push(r)
      }

      const mediaIds = Object.keys(byMedia)
      const mediaMap = await getMediaByIds(mediaIds)

      const ranked = mediaIds
        .map((mid) => {
          const agg = aggregateMemberRatings(byMedia[mid])
          return { media: mediaMap[mid], ...agg }
        })
        .filter((x) => x.media)
        .sort((a, b) => b.avg - a.avg)
        .slice(0, 20)

      setTopMedia(ranked)
      setLoading(false)
    }
    load()
  }, [id])

  const handleJoin = async () => {
    if (!firebaseUser) { router.push('/auth/signin'); return }
    setJoining(true)
    await joinGroup(id, firebaseUser.uid)
    router.refresh()
    setJoining(false)
  }

  if (loading) return <p className="text-gray-400 text-sm">Loading...</p>
  if (notFound || !group) return <p className="text-gray-500">Group not found.</p>

  const inviteUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/groups/join/${group.invite_code}`

  return (
    <div className="max-w-3xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
          <p className="text-gray-400 text-sm">{group.members.length} members</p>
        </div>
        {isMember ? (
          <div className="flex flex-col items-end gap-1">
            <p className="text-xs text-gray-400">Invite link</p>
            <button
              onClick={() => navigator.clipboard.writeText(inviteUrl)}
              className="text-sm text-blue-600 hover:underline"
            >
              Copy link
            </button>
          </div>
        ) : (
          <button
            onClick={handleJoin}
            disabled={joining}
            className="py-1.5 px-4 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
          >
            {joining ? 'Joining...' : 'Join Group'}
          </button>
        )}
      </div>

      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
        Top Rated by Group
      </h2>
      {topMedia.length === 0 ? (
        <p className="text-gray-400 text-sm">No ratings yet — rate some media and come back!</p>
      ) : (
        <div className="flex flex-col gap-6">
          {topMedia.map(({ media, avg, count }) => (
            <div key={media.id} className="border border-gray-100 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                {media.poster_url && (
                  <img src={media.poster_url} alt={media.title} className="w-10 h-14 object-cover rounded" />
                )}
                <Link href={`/media/${media.id}`} className="font-medium text-gray-900 hover:text-blue-600">
                  {media.title}
                </Link>
              </div>
              <GroupRatingChart
                distribution={aggregateMemberRatings(
                  topMedia.find((t) => t.media.id === media.id)
                    ? [] // placeholder — distribution already computed
                    : []
                ).distribution}
                avg={avg}
                count={count}
                label={group.name}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/groups/ src/app/groups/
git commit -m "feat: add group detail page with leaderboard and invite link"
```

---

## Task 4: Join via Invite Link

**Files:**
- Create: `src/app/groups/join/[code]/page.tsx`

- [ ] **Step 1: Write join page**

```typescript
// src/app/groups/join/[code]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { getGroupByInviteCode, joinGroup } from '@/lib/groups'
import type { Group } from '@/types'

export default function JoinGroupPage() {
  const { code } = useParams<{ code: string }>()
  const { firebaseUser, userDoc } = useAuth()
  const router = useRouter()

  const [group, setGroup] = useState<Group | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    getGroupByInviteCode(code).then((g) => {
      if (!g) setNotFound(true)
      else setGroup(g)
    })
  }, [code])

  const alreadyMember = group ? (userDoc?.groups.includes(group.id) ?? false) : false

  const handleJoin = async () => {
    if (!firebaseUser) { router.push('/auth/signin'); return }
    if (!group) return
    setJoining(true)
    await joinGroup(group.id, firebaseUser.uid)
    router.push(`/groups/${group.id}`)
  }

  if (notFound) return (
    <div className="text-center py-16">
      <p className="text-gray-500">This invite link is invalid or has expired.</p>
    </div>
  )

  if (!group) return <p className="text-gray-400 text-sm">Loading...</p>

  return (
    <div className="max-w-sm mx-auto text-center py-16">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">You're invited!</h1>
      <p className="text-gray-500 mb-6">
        Join <span className="font-semibold text-gray-800">{group.name}</span> on CultureDB
      </p>
      {alreadyMember ? (
        <div>
          <p className="text-green-600 text-sm mb-4">You're already a member.</p>
          <button
            onClick={() => router.push(`/groups/${group.id}`)}
            className="py-2 px-5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Go to Group
          </button>
        </div>
      ) : (
        <button
          onClick={handleJoin}
          disabled={joining}
          className="py-2 px-5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
        >
          {joining ? 'Joining...' : 'Join Group'}
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/groups/join/
git commit -m "feat: add group invite link join page"
```

---

## Task 5: Rating Tabs on Media Pages (Friends + Groups)

**Files:**
- Create: `src/components/media/RatingTabs.tsx`
- Modify: `src/app/media/[id]/page.tsx` — replace static chart with RatingTabs

- [ ] **Step 1: Write RatingTabs.tsx**

```typescript
// src/components/media/RatingTabs.tsx
'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getMediaRatings } from '@/lib/ratings'
import { getUserRatings, getMediaByIds } from '@/lib/profile'
import { getUserGroups, getGroupRatingsForMedia, aggregateMemberRatings } from '@/lib/groups'
import { ScoreDistributionChart } from './ScoreDistributionChart'
import { GroupRatingChart } from '@/components/groups/GroupRatingChart'
import type { Media, Rating, Group } from '@/types'

type Tab = 'all' | 'friends' | string // string = group id

interface Props {
  media: Media
}

export function RatingTabs({ media }: Props) {
  const { firebaseUser, userDoc } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('all')
  const [friendRatings, setFriendRatings] = useState<Rating[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [groupRatings, setGroupRatings] = useState<Record<string, Rating[]>>({})
  const [loadedSocial, setLoadedSocial] = useState(false)

  useEffect(() => {
    if (!firebaseUser || !userDoc || loadedSocial) return

    const loadSocial = async () => {
      // Friend ratings: ratings from followed users for this media
      const followedRatings = await Promise.all(
        userDoc.following.map((uid) => getUserRatings(uid))
      )
      const forThisMedia = followedRatings
        .flat()
        .filter((r) => r.media_id === media.id && r.sub_id === null)
      setFriendRatings(forThisMedia)

      // Group ratings
      const userGroups = await getUserGroups(userDoc.groups)
      setGroups(userGroups)

      const groupRatingMap: Record<string, Rating[]> = {}
      await Promise.all(
        userGroups.map(async (g) => {
          const ratings = await getGroupRatingsForMedia(g, media.id)
          groupRatingMap[g.id] = ratings
        })
      )
      setGroupRatings(groupRatingMap)
      setLoadedSocial(true)
    }

    loadSocial()
  }, [firebaseUser, userDoc, media.id, loadedSocial])

  const tabs: { id: Tab; label: string }[] = [
    { id: 'all', label: 'All Ratings' },
    ...(userDoc ? [{ id: 'friends' as Tab, label: 'Friends' }] : []),
    ...groups.map((g) => ({ id: g.id, label: g.name })),
  ]

  const renderChart = () => {
    if (activeTab === 'all') {
      return (
        <ScoreDistributionChart
          distribution={media.score_distribution}
          avgScore={media.avg_score}
          ratingCount={media.rating_count}
        />
      )
    }
    if (activeTab === 'friends') {
      const agg = aggregateMemberRatings(friendRatings)
      return (
        <GroupRatingChart
          distribution={agg.distribution}
          avg={agg.avg}
          count={agg.count}
          label="Friends"
        />
      )
    }
    // Group tab
    const group = groups.find((g) => g.id === activeTab)
    if (!group) return null
    const agg = aggregateMemberRatings(groupRatings[group.id] ?? [])
    return (
      <GroupRatingChart
        distribution={agg.distribution}
        avg={agg.avg}
        count={agg.count}
        label={group.name}
      />
    )
  }

  if (media.rating_count === 0 && !firebaseUser) return null

  return (
    <div className="bg-gray-50 rounded-2xl p-5 mb-6">
      {tabs.length > 1 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-1 px-3 rounded-full text-xs font-medium border transition ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}
      {renderChart()}
    </div>
  )
}
```

- [ ] **Step 2: Replace static chart in media detail page**

In `src/app/media/[id]/page.tsx`:

Remove this import:
```typescript
import { ScoreDistributionChart } from '@/components/media/ScoreDistributionChart'
```

Add this import:
```typescript
import { RatingTabs } from '@/components/media/RatingTabs'
```

Replace this JSX block:
```typescript
{media.rating_count > 0 && (
  <div className="bg-gray-50 rounded-2xl p-5 mb-6">
    <h2 className="text-sm font-semibold text-gray-700 mb-3">Score Distribution</h2>
    <ScoreDistributionChart
      distribution={media.score_distribution}
      avgScore={media.avg_score}
      ratingCount={media.rating_count}
    />
  </div>
)}
```

With:
```typescript
<RatingTabs media={media} />
```

- [ ] **Step 3: Add "Create Group" link to Navbar**

In `src/components/layout/Navbar.tsx`, inside the authenticated section, add after the `+ Add` button:

```typescript
<Link
  href="/groups/new"
  className="text-sm text-gray-600 hover:text-gray-900"
>
  Groups
</Link>
```

- [ ] **Step 4: Commit**

```bash
git add src/components/media/RatingTabs.tsx src/app/media/ src/components/layout/Navbar.tsx
git commit -m "feat: add rating tabs with friends and group overlays on media pages"
```

---

## Task 6: Smoke Test & Manual Verification

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
1. Navbar shows "Groups" link when signed in
2. `/groups/new` — create a group, redirects to group page
3. Group page shows invite link copy button
4. `/groups/join/[code]` — visiting the invite link shows group name and join button
5. After joining, group appears in user doc and on profile
6. On a media page with ratings, "Friends" tab appears if you follow users who rated it
7. Group tabs appear for each group the user is in
8. Each tab shows the correct filtered bar chart

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "chore: plan 3 complete — groups and social data views"
```
