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
    <div className="text-center py-20">
      <p style={{ color: '#8a8a96' }}>This invite link is invalid or has expired.</p>
    </div>
  )

  if (!group) return <p className="text-sm" style={{ color: '#8a8a96' }}>Loading...</p>

  return (
    <div className="max-w-sm mx-auto text-center py-20">
      <p className="text-xs uppercase tracking-widest mb-4" style={{ color: '#e8a027' }}>You're invited</p>
      <h1 className="text-3xl mb-3" style={{ fontFamily: '"Playfair Display", serif', color: '#f0ede8' }}>
        {group.name}
      </h1>
      <p className="text-sm mb-8" style={{ color: '#8a8a96' }}>
        Join this group on CultureDB to see how your ratings compare.
      </p>
      {alreadyMember ? (
        <div>
          <p className="text-sm mb-4" style={{ color: '#e8a027' }}>You're already a member.</p>
          <button
            onClick={() => router.push(`/groups/${group.id}`)}
            className="py-2 px-6 rounded-lg text-sm font-semibold"
            style={{ backgroundColor: '#e8a027', color: '#0c0c0e' }}
          >
            Go to Group
          </button>
        </div>
      ) : (
        <button
          onClick={handleJoin}
          disabled={joining}
          className="py-2 px-6 rounded-lg text-sm font-semibold"
          style={{ backgroundColor: '#e8a027', color: '#0c0c0e', opacity: joining ? 0.5 : 1 }}
        >
          {joining ? 'Joining...' : 'Join Group'}
        </button>
      )}
    </div>
  )
}
