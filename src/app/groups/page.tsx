'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { getUserGroups } from '@/lib/groups'
import type { Group } from '@/types'

export default function GroupsPage() {
  const { firebaseUser, userDoc } = useAuth()
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!firebaseUser || !userDoc) {
      setLoading(false)
      return
    }
    setLoading(true)
    getUserGroups(userDoc.groups ?? [])
      .then(setGroups)
      .finally(() => setLoading(false))
  }, [firebaseUser, userDoc])

  if (!firebaseUser) {
    return (
      <main
        className="min-h-screen flex flex-col items-center justify-center gap-4"
        style={{ backgroundColor: '#0c0c0e' }}
      >
        <p style={{ color: '#8a8a96' }}>Sign in to see your groups.</p>
        <Link
          href="/auth/signin"
          className="py-1.5 px-4 rounded-full text-xs font-semibold"
          style={{ backgroundColor: '#e8a027', color: '#0c0c0e' }}
        >
          Sign in
        </Link>
      </main>
    )
  }

  return (
    <main className="min-h-screen px-4 py-10" style={{ backgroundColor: '#0c0c0e' }}>
      <div className="max-w-2xl mx-auto">
        <p
          className="text-xs uppercase tracking-widest mb-2"
          style={{ color: '#e8a027' }}
        >
          Your Groups
        </p>
        <div className="flex items-center justify-between mb-8">
          <h1
            className="text-3xl"
            style={{ fontFamily: '"Playfair Display", serif', color: '#f0ede8' }}
          >
            Groups
          </h1>
          <Link
            href="/groups/new"
            className="py-1.5 px-4 rounded-full text-xs font-semibold"
            style={{ backgroundColor: '#e8a027', color: '#0c0c0e' }}
          >
            Create new group
          </Link>
        </div>

        {loading ? (
          <p style={{ color: '#8a8a96' }}>Loading…</p>
        ) : groups.length === 0 ? (
          <div
            className="rounded-2xl p-5 flex flex-col items-center gap-4"
            style={{ backgroundColor: '#161618', border: '1px solid #2a2a2e' }}
          >
            <p style={{ color: '#8a8a96' }}>No groups yet.</p>
            <Link
              href="/groups/new"
              className="py-1.5 px-4 rounded-full text-xs font-semibold"
              style={{ backgroundColor: '#e8a027', color: '#0c0c0e' }}
            >
              Create new group
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {groups.map((group) => (
              <li key={group.id}>
                <Link
                  href={`/groups/${group.id}`}
                  className="block rounded-2xl p-5 transition-colors"
                  style={{ backgroundColor: '#161618', border: '1px solid #2a2a2e' }}
                  onMouseEnter={(e: any) => (e.currentTarget.style.borderColor = '#e8a027')}
                  onMouseLeave={(e: any) => (e.currentTarget.style.borderColor = '#2a2a2e')}
                >
                  <span style={{ color: '#f0ede8', fontWeight: 500 }}>{group.name}</span>
                  <span className="ml-3 text-xs" style={{ color: '#8a8a96' }}>
                    {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}
