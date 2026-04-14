'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import {
  getUserByUsername, getUserRatings, getMediaByIds,
  groupRatingsByCategory, buildCategoryAffinityData,
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
      const allIds = Array.from(new Set([
        ...userRatings.map((r) => r.media_id),
        ...userWatchlist.map((w) => w.media_id),
      ]))
      setMediaMap(await getMediaByIds(allIds))
      setLoading(false)
    }
    load()
  }, [username])

  if (loading) return <p className="text-sm" style={{ color: '#8a8a96' }}>Loading...</p>
  if (notFound) return <p style={{ color: '#8a8a96' }}>User not found.</p>
  if (!profileUser) return null

  const grouped = groupRatingsByCategory(ratings, mediaMap)
  const affinityData = buildCategoryAffinityData(ratings, mediaMap)
  const completedCount = ratings.filter((r) => r.status === 'completed').length

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-start gap-5 mb-10">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center shrink-0 overflow-hidden"
          style={{ backgroundColor: '#161618', border: '1px solid #2a2a2e' }}
        >
          {profileUser.avatar_url ? (
            <img src={profileUser.avatar_url} alt={profileUser.username} className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl font-bold" style={{ color: '#e8a027', fontFamily: '"Playfair Display", serif' }}>
              {profileUser.username[0].toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex-1 pt-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl" style={{ fontFamily: '"Playfair Display", serif', color: '#f0ede8' }}>
              @{profileUser.username}
            </h1>
            <FollowButton targetUid={profileUser.uid} />
          </div>
          {profileUser.bio && (
            <p className="text-sm mb-1" style={{ color: '#8a8a96' }}>{profileUser.bio}</p>
          )}
          <p className="text-xs" style={{ color: '#3a3a3e' }}>{completedCount} ratings</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Ranked lists */}
        <div className="md:col-span-2 flex flex-col gap-10">
          {CATEGORY_ORDER.filter((cat) => grouped[cat]?.length).map((cat) => (
            <RankedList key={cat} items={grouped[cat]!} category={cat} />
          ))}
          {Object.keys(grouped).length === 0 && (
            <p className="text-sm" style={{ color: '#3a3a3e' }}>No ratings yet.</p>
          )}
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-8">
          {affinityData.length > 0 && <CategoryAffinityChart data={affinityData} />}
          <WatchlistSection entries={watchlist} mediaMap={mediaMap} />
        </div>
      </div>
    </div>
  )
}
