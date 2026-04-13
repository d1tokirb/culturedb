'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { createUserDoc } from '@/lib/auth'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'

const inputStyle = {
  backgroundColor: '#161618',
  border: '1px solid #2a2a2e',
  color: '#f0ede8',
}

export function OnboardingForm() {
  const { firebaseUser } = useAuth()
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const checkUsernameAvailable = async (name: string) => {
    const q = query(collection(db, 'users'), where('username', '==', name))
    const snap = await getDocs(q)
    return snap.empty
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!firebaseUser) return
    setError('')
    setLoading(true)

    const trimmed = username.trim().toLowerCase()
    if (!/^[a-z0-9_]{3,20}$/.test(trimmed)) {
      setError('3–20 characters: letters, numbers, underscores only')
      setLoading(false)
      return
    }

    const available = await checkUsernameAvailable(trimmed)
    if (!available) {
      setError('Username already taken')
      setLoading(false)
      return
    }

    await createUserDoc(firebaseUser.uid, {
      username: trimmed,
      avatar_url: firebaseUser.photoURL ?? '',
      bio: bio.trim(),
      created_at: Date.now(),
      groups: [],
      following: [],
    })

    router.push('/')
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium uppercase tracking-widest" style={{ color: '#8a8a96' }}>
          Username
        </label>
        <input
          type="text"
          placeholder="e.g. filmhead"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="w-full py-3 px-4 rounded-lg text-sm outline-none transition-all"
          style={inputStyle}
          onFocus={e => (e.currentTarget.style.borderColor = '#e8a027')}
          onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2e')}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium uppercase tracking-widest" style={{ color: '#8a8a96' }}>
          Bio <span style={{ color: '#2a2a2e' }}>— optional</span>
        </label>
        <textarea
          placeholder="What are you into?"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          className="w-full py-3 px-4 rounded-lg text-sm outline-none transition-all resize-none"
          style={inputStyle}
          onFocus={e => (e.currentTarget.style.borderColor = '#e8a027')}
          onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2e')}
        />
      </div>
      {error && <p className="text-xs px-1" style={{ color: '#e05252' }}>{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 px-4 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 mt-2"
        style={{ backgroundColor: '#e8a027', color: '#0c0c0e' }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f0b035')}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#e8a027')}
      >
        {loading ? 'Setting up...' : 'Get Started'}
      </button>
    </form>
  )
}
