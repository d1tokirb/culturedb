'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { followUser, unfollowUser } from '@/lib/profile'

interface Props { targetUid: string }

export function FollowButton({ targetUid }: Props) {
  const { firebaseUser, userDoc } = useAuth()
  const isFollowing = userDoc?.following.includes(targetUid) ?? false
  const [optimistic, setOptimistic] = useState<boolean | null>(null)
  const following = optimistic ?? isFollowing

  if (!firebaseUser || firebaseUser.uid === targetUid) return null

  const toggle = async () => {
    setOptimistic(!following)
    try {
      if (following) await unfollowUser(firebaseUser.uid, targetUid)
      else await followUser(firebaseUser.uid, targetUid)
    } catch {
      setOptimistic(following)
    }
  }

  return (
    <button
      onClick={toggle}
      className="py-1.5 px-4 rounded-full text-xs font-semibold transition-colors"
      style={following
        ? { backgroundColor: 'transparent', color: '#8a8a96', border: '1px solid #2a2a2e' }
        : { backgroundColor: '#e8a027', color: '#0c0c0e', border: '1px solid #e8a027' }
      }
    >
      {following ? 'Following' : 'Follow'}
    </button>
  )
}
