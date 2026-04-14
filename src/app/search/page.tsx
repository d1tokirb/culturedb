'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { searchMedia } from '@/lib/media'
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

function SearchContent() {
  const params = useSearchParams()
  const router = useRouter()
  const q = params.get('q') ?? ''
  const [results, setResults] = useState<Media[]>([])
  const [typeFilter, setTypeFilter] = useState<MediaType | ''>('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!q) return
    setLoading(true)
    searchMedia(q, typeFilter || undefined)
      .then(setResults)
      .finally(() => setLoading(false))
  }, [q, typeFilter])

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: '#8a8a96' }}>
            Search results
          </p>
          <h1
            className="text-2xl"
            style={{ fontFamily: '"Playfair Display", serif', color: '#f0ede8' }}
          >
            "{q}"
          </h1>
        </div>
        <button
          onClick={() => router.push('/add')}
          className="text-sm font-medium transition-colors"
          style={{ color: '#e8a027' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#f0b035')}
          onMouseLeave={e => (e.currentTarget.style.color = '#e8a027')}
        >
          + Add new entry
        </button>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => setTypeFilter(t.value as MediaType | '')}
            className="py-1 px-3 rounded-full text-xs font-medium transition-colors"
            style={{
              backgroundColor: typeFilter === t.value ? '#e8a027' : '#161618',
              color: typeFilter === t.value ? '#0c0c0e' : '#8a8a96',
              border: `1px solid ${typeFilter === t.value ? '#e8a027' : '#2a2a2e'}`,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm" style={{ color: '#8a8a96' }}>Searching...</p>
      ) : results.length === 0 ? (
        <div className="py-16 text-center">
          <p className="mb-4" style={{ color: '#8a8a96' }}>No results for "{q}"</p>
          <button
            onClick={() => router.push('/add')}
            className="py-2 px-5 rounded-lg text-sm font-semibold"
            style={{ backgroundColor: '#e8a027', color: '#0c0c0e' }}
          >
            Create new entry
          </button>
        </div>
      ) : (
        <div className="flex flex-col">
          {results.map((m) => (
            <MediaCard key={m.id} media={m} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<p className="text-sm" style={{ color: '#8a8a96' }}>Loading...</p>}>
      <SearchContent />
    </Suspense>
  )
}
