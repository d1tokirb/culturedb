'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getUserRatings } from '@/lib/profile'
import { getUserGroups, getGroupRatingsForMedia, aggregateMemberRatings } from '@/lib/groups'
import { ScoreDistributionChart } from './ScoreDistributionChart'
import { GroupRatingChart } from '@/components/groups/GroupRatingChart'
import type { Media, Rating, Group } from '@/types'

type Tab = 'all' | 'friends' | string

interface Props { media: Media }

export function RatingTabs({ media }: Props) {
  const { firebaseUser, userDoc } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('all')
  const [friendRatings, setFriendRatings] = useState<Rating[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [groupRatings, setGroupRatings] = useState<Record<string, Rating[]>>({})
  const [loadedSocial, setLoadedSocial] = useState(false)

  useEffect(() => {
    if (!firebaseUser || !userDoc || loadedSocial) return
    const load = async () => {
      const followedRatings = await Promise.all(userDoc.following.map((uid) => getUserRatings(uid)))
      setFriendRatings(followedRatings.flat().filter((r) => r.media_id === media.id && r.sub_id === null))

      const userGroups = await getUserGroups(userDoc.groups)
      setGroups(userGroups)

      const map: Record<string, Rating[]> = {}
      await Promise.all(userGroups.map(async (g) => {
        map[g.id] = await getGroupRatingsForMedia(g, media.id)
      }))
      setGroupRatings(map)
      setLoadedSocial(true)
    }
    load()
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
      return <GroupRatingChart distribution={agg.distribution} avg={agg.avg} count={agg.count} label="Friends" />
    }
    const group = groups.find((g) => g.id === activeTab)
    if (!group) return null
    const agg = aggregateMemberRatings(groupRatings[group.id] ?? [])
    return <GroupRatingChart distribution={agg.distribution} avg={agg.avg} count={agg.count} label={group.name} />
  }

  if (media.rating_count === 0 && tabs.length === 1) return null

  return (
    <div className="rounded-2xl p-5 mb-6" style={{ backgroundColor: '#161618', border: '1px solid #2a2a2e' }}>
      {tabs.length > 1 && (
        <div className="flex gap-2 mb-5 flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="py-1 px-3 rounded-full text-xs font-medium transition-colors"
              style={{
                backgroundColor: activeTab === tab.id ? '#e8a027' : 'transparent',
                color: activeTab === tab.id ? '#0c0c0e' : '#8a8a96',
                border: `1px solid ${activeTab === tab.id ? '#e8a027' : '#2a2a2e'}`,
              }}
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
