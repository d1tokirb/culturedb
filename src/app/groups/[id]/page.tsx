'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { getGroup, joinGroup, aggregateMemberRatings } from '@/lib/groups'
import { getUserRatings, getMediaByIds } from '@/lib/profile'
import { GroupRatingChart } from '@/components/groups/GroupRatingChart'
import Link from 'next/link'
import Image from 'next/image'
import type { Group, Media, Rating } from '@/types'

export default function GroupPage() {
  const { id } = useParams<{ id: string }>()
  const { firebaseUser, userDoc } = useAuth()
  const router = useRouter()

  const [group, setGroup] = useState<Group | null>(null)
  const [topMedia, setTopMedia] = useState<{ media: Media; avg: number; count: number; ratings: Rating[] }[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [joining, setJoining] = useState(false)
  const [copied, setCopied] = useState(false)

  const isMember = userDoc?.groups.includes(id) ?? false

  useEffect(() => {
    const load = async () => {
      const g = await getGroup(id)
      if (!g) { setNotFound(true); setLoading(false); return }
      setGroup(g)

      const allRatings = await Promise.all(g.members.map((uid) => getUserRatings(uid)))
      const flat = allRatings.flat().filter((r) => r.sub_id === null)

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
          return { media: mediaMap[mid], ...agg, ratings: byMedia[mid] }
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

  const handleCopy = () => {
    const inviteUrl = `${window.location.origin}/groups/join/${group!.invite_code}`
    navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return <p className="text-sm" style={{ color: '#8a8a96' }}>Loading...</p>
  if (notFound || !group) return <p style={{ color: '#8a8a96' }}>Group not found.</p>

  return (
    <div className="max-w-3xl">
      <div className="flex items-start justify-between mb-10">
        <div>
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#e8a027' }}>Group</p>
          <h1 className="text-3xl mb-1" style={{ fontFamily: '"Playfair Display", serif', color: '#f0ede8' }}>
            {group.name}
          </h1>
          <p className="text-sm" style={{ color: '#8a8a96' }}>{group.members.length} members</p>
        </div>
        {isMember ? (
          <button
            onClick={handleCopy}
            className="py-2 px-4 rounded-lg text-xs font-semibold transition-colors"
            style={{ backgroundColor: '#161618', color: copied ? '#e8a027' : '#8a8a96', border: '1px solid #2a2a2e' }}
          >
            {copied ? 'Copied!' : 'Copy invite link'}
          </button>
        ) : (
          <button
            onClick={handleJoin}
            disabled={joining}
            className="py-2 px-5 rounded-lg text-sm font-semibold"
            style={{ backgroundColor: '#e8a027', color: '#0c0c0e', opacity: joining ? 0.5 : 1 }}
          >
            {joining ? 'Joining...' : 'Join Group'}
          </button>
        )}
      </div>

      <p className="text-xs uppercase tracking-widest mb-5" style={{ color: '#8a8a96' }}>
        Top Rated by Group
      </p>

      {topMedia.length === 0 ? (
        <p className="text-sm" style={{ color: '#3a3a3e' }}>No ratings yet — rate some media and come back!</p>
      ) : (
        <div className="flex flex-col gap-4">
          {topMedia.map(({ media, avg, count, ratings }) => (
            <div key={media.id} className="rounded-2xl p-5" style={{ backgroundColor: '#161618', border: '1px solid #2a2a2e' }}>
              <div className="flex items-center gap-3 mb-4">
                {media.poster_url && (
                  <div className="relative w-10 h-14 rounded-lg overflow-hidden shrink-0">
                    <Image src={media.poster_url} alt={media.title} fill className="object-cover" />
                  </div>
                )}
                <Link
                  href={`/media/${media.id}`}
                  className="font-medium transition-colors"
                  style={{ color: '#f0ede8' }}
                  onMouseEnter={(e: any) => (e.currentTarget.style.color = '#e8a027')}
                  onMouseLeave={(e: any) => (e.currentTarget.style.color = '#f0ede8')}
                >
                  {media.title}
                </Link>
              </div>
              <GroupRatingChart
                distribution={aggregateMemberRatings(ratings).distribution}
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
