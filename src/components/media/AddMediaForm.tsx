'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { createMedia } from '@/lib/media'
import type { MediaType } from '@/types'

const MEDIA_TYPES: { value: MediaType; label: string }[] = [
  { value: 'show', label: 'TV Show' },
  { value: 'movie', label: 'Movie' },
  { value: 'game', label: 'Game' },
  { value: 'album', label: 'Album' },
  { value: 'song', label: 'Song' },
  { value: 'person', label: 'Person (Actor / Director / Artist)' },
]

const inputStyle = {
  backgroundColor: '#0c0c0e',
  border: '1px solid #2a2a2e',
  color: '#f0ede8',
  width: '100%',
  padding: '10px 14px',
  borderRadius: '8px',
  outline: 'none',
  fontSize: '14px',
}

const labelStyle = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase' as const,
  color: '#8a8a96',
  marginBottom: '6px',
}

export function AddMediaForm() {
  const { firebaseUser } = useAuth()
  const router = useRouter()
  const [type, setType] = useState<MediaType>('show')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [posterFile, setPosterFile] = useState<File | null>(null)
  const [releaseYear, setReleaseYear] = useState('')
  const [genre, setGenre] = useState('')
  const [creator, setCreator] = useState('')
  const [artist, setArtist] = useState('')
  const [studio, setStudio] = useState('')
  const [platform, setPlatform] = useState('')
  const [role, setRole] = useState<'actor' | 'director' | 'artist'>('actor')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!firebaseUser) return
    setLoading(true)
    setError('')

    const metadata: Record<string, unknown> = {}
    if (releaseYear) metadata.release_year = parseInt(releaseYear)
    if (genre) metadata.genre = genre
    if (type === 'show') metadata.creator = creator
    if (type === 'movie') metadata.director = creator
    if (type === 'game') { metadata.studio = studio; metadata.platform = platform }
    if (type === 'album' || type === 'song') metadata.artist = artist
    if (type === 'person') metadata.role = role

    try {
      const id = await createMedia(
        {
          title,
          type,
          description,
          poster_url: '',
          created_by: firebaseUser.uid,
          created_at: Date.now(),
          metadata,
        },
        posterFile ?? undefined
      )
      router.push(`/media/${id}?rate=true`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  const focusHandler = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    (e.currentTarget.style.borderColor = '#e8a027')
  const blurHandler = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    (e.currentTarget.style.borderColor = '#2a2a2e')

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '520px' }}>
      <div>
        <label style={labelStyle}>Category</label>
        <select value={type} onChange={(e) => setType(e.target.value as MediaType)} style={inputStyle} onFocus={focusHandler} onBlur={blurHandler}>
          {MEDIA_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label style={labelStyle}>Title</label>
        <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
      </div>

      <div>
        <label style={labelStyle}>Description <span style={{ color: '#3a3a3e' }}>— optional</span></label>
        <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} style={{ ...inputStyle, resize: 'none' }} onFocus={focusHandler} onBlur={blurHandler} />
      </div>

      <div>
        <label style={labelStyle}>Poster Image <span style={{ color: '#3a3a3e' }}>— optional</span></label>
        <input type="file" accept="image/*" onChange={(e) => setPosterFile(e.target.files?.[0] ?? null)}
          style={{ fontSize: '13px', color: '#8a8a96' }} />
      </div>

      {(type === 'show' || type === 'movie') && (
        <div>
          <label style={labelStyle}>{type === 'show' ? 'Creator' : 'Director'}</label>
          <input type="text" value={creator} onChange={(e) => setCreator(e.target.value)} style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
        </div>
      )}

      {(type === 'album' || type === 'song') && (
        <div>
          <label style={labelStyle}>Artist</label>
          <input type="text" value={artist} onChange={(e) => setArtist(e.target.value)} style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
        </div>
      )}

      {type === 'game' && (
        <>
          <div>
            <label style={labelStyle}>Studio</label>
            <input type="text" value={studio} onChange={(e) => setStudio(e.target.value)} style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
          </div>
          <div>
            <label style={labelStyle}>Platform</label>
            <input type="text" placeholder="e.g. PC, PS5, Switch" value={platform} onChange={(e) => setPlatform(e.target.value)} style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
          </div>
        </>
      )}

      {type === 'person' && (
        <div>
          <label style={labelStyle}>Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value as 'actor' | 'director' | 'artist')} style={inputStyle} onFocus={focusHandler} onBlur={blurHandler}>
            <option value="actor">Actor</option>
            <option value="director">Director</option>
            <option value="artist">Artist</option>
          </select>
        </div>
      )}

      {type !== 'person' && (
        <div>
          <label style={labelStyle}>Release Year</label>
          <input type="number" min="1900" max={new Date().getFullYear() + 2} value={releaseYear} onChange={(e) => setReleaseYear(e.target.value)} style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
        </div>
      )}

      <div>
        <label style={labelStyle}>Genre <span style={{ color: '#3a3a3e' }}>— optional</span></label>
        <input type="text" value={genre} onChange={(e) => setGenre(e.target.value)} style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
      </div>

      {error && <p style={{ color: '#e05252', fontSize: '13px' }}>{error}</p>}

      <button
        type="submit"
        disabled={loading}
        style={{
          backgroundColor: '#e8a027',
          color: '#0c0c0e',
          padding: '12px 24px',
          borderRadius: '8px',
          fontWeight: 700,
          fontSize: '14px',
          border: 'none',
          cursor: 'pointer',
          opacity: loading ? 0.5 : 1,
          alignSelf: 'flex-start',
        }}
      >
        {loading ? 'Creating...' : 'Create & Rate'}
      </button>
    </form>
  )
}
