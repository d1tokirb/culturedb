'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { createGroup } from '@/lib/groups'

const inputStyle = {
  backgroundColor: '#0c0c0e', border: '1px solid #2a2a2e',
  color: '#f0ede8', width: '100%', padding: '10px 14px',
  borderRadius: '8px', outline: 'none', fontSize: '14px',
}

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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px' }}>
      <div>
        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8a8a96', marginBottom: '6px' }}>
          Group Name
        </label>
        <input
          type="text"
          placeholder="e.g. The Crew"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={inputStyle}
          onFocus={e => (e.currentTarget.style.borderColor = '#e8a027')}
          onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2e')}
        />
      </div>
      {error && <p style={{ color: '#e05252', fontSize: '13px' }}>{error}</p>}
      <button
        type="submit"
        disabled={loading}
        style={{
          backgroundColor: '#e8a027', color: '#0c0c0e',
          padding: '11px 20px', borderRadius: '8px',
          fontWeight: 700, fontSize: '14px', border: 'none',
          cursor: 'pointer', opacity: loading ? 0.5 : 1, alignSelf: 'flex-start',
        }}
      >
        {loading ? 'Creating...' : 'Create Group'}
      </button>
    </form>
  )
}
