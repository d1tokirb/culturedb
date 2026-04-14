'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getRecentMedia } from '@/lib/media'
import { MediaCard } from '@/components/media/MediaCard'
import type { Media, MediaType } from '@/types'

const TYPES: { value: MediaType | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'show', label: 'Shows' },
  { value: 'movie', label: 'Movies' },
  { value: 'game', label: 'Games' },
  { value: 'album', label: 'Albums' },
  { value: 'song', label: 'Songs' },
  { value: 'person', label: 'People' },
]

export default function HomePage() {
  const [allMedia, setAllMedia] = useState<Media[]>([])
  const [filter, setFilter] = useState<MediaType | ''>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getRecentMedia(40)
      .then(setAllMedia)
      .finally(() => setLoading(false))
  }, [])

  const displayed = filter ? allMedia.filter((m) => m.type === filter) : allMedia

  return (
    <div>
      {/* Hero header */}
      <div className="mb-10">
        <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#e8a027' }}>
          CultureDB
        </p>
        <h1
          className="text-4xl mb-3"
          style={{ fontFamily: '"Playfair Display", serif', color: '#f0ede8' }}
        >
          The cultural record.
        </h1>
        <p className="text-sm mb-6" style={{ color: '#8a8a96' }}>
          Rate everything worth experiencing — films, games, music, people.
        </p>
        <Link
          href="/add"
          className="inline-block py-2 px-5 rounded-lg text-sm font-semibold"
          style={{ backgroundColor: '#e8a027', color: '#0c0c0e' }}
        >
          + Add Media
        </Link>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => setFilter(t.value as MediaType | '')}
            className="py-1 px-3 rounded-full text-xs font-medium transition-colors"
            style={{
              backgroundColor: filter === t.value ? '#e8a027' : '#161618',
              color: filter === t.value ? '#0c0c0e' : '#8a8a96',
              border: `1px solid ${filter === t.value ? '#e8a027' : '#2a2a2e'}`,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Media list */}
      {loading ? (
        <p className="text-sm" style={{ color: '#8a8a96' }}>Loading...</p>
      ) : displayed.length === 0 ? (
        <div className="py-20 text-center">
          <p className="mb-2" style={{ color: '#8a8a96' }}>Nothing here yet.</p>
          <Link
            href="/add"
            className="text-sm font-medium"
            style={{ color: '#e8a027' }}
          >
            Be the first to add something →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-1">
          {displayed.map((m) => (
            <MediaCard key={m.id} media={m} />
          ))}
        </div>
      )}
    </div>
  )
}
