'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { AddMediaForm } from '@/components/media/AddMediaForm'
import { searchMedia } from '@/lib/media'
import type { Media } from '@/types'

type Step = 'search' | 'create'

export default function AddPage() {
  const [step, setStep] = useState<Step>('search')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Media[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim()) {
      setResults([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await searchMedia(query.trim())
        setResults(res)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  return (
    <div>
      <p className="text-xs uppercase tracking-widest mb-3" style={{ color: '#e8a027' }}>
        Add to the database
      </p>

      {step === 'search' && (
        <>
          <h1
            className="text-3xl mb-8"
            style={{ fontFamily: '"Playfair Display", serif', color: '#f0ede8' }}
          >
            New Entry
          </h1>

          <div className="mb-6">
            <input
              type="text"
              placeholder="Search before adding..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#e8a027'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#2a2a2e'
              }}
              style={{
                backgroundColor: '#161618',
                border: '1px solid #2a2a2e',
                color: '#f0ede8',
                padding: '12px 16px',
                borderRadius: '10px',
                outline: 'none',
                fontSize: '15px',
                width: '100%',
              }}
            />
          </div>

          {loading && (
            <p style={{ color: '#8a8a96', fontSize: '14px' }} className="mb-4">
              Searching...
            </p>
          )}

          {results.length > 0 && (
            <div className="mb-6" style={{ border: '1px solid #2a2a2e', borderRadius: '12px', overflow: 'hidden' }}>
              {results.map((item) => (
                <Link
                  key={item.id}
                  href={`/media/${item.id}`}
                  className="flex gap-3 items-center p-3 transition-colors"
                  style={{ color: '#f0ede8', textDecoration: 'none' }}
                  onMouseEnter={(e) => {
                    ;(e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#161618'
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'transparent'
                  }}
                >
                  {item.poster_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.poster_url}
                      alt={item.title}
                      style={{ width: '36px', height: '54px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }}
                    />
                  )}
                  <div>
                    <div style={{ fontWeight: 500 }}>{item.title}</div>
                    <div style={{ fontSize: '12px', color: '#8a8a96', textTransform: 'capitalize' }}>{item.type}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <button
            onClick={() => setStep('create')}
            style={{
              background: 'none',
              border: 'none',
              color: '#e8a027',
              cursor: 'pointer',
              fontSize: '15px',
              padding: 0,
            }}
          >
            {results.length > 0
              ? "Don't see it? Create a new entry →"
              : query.trim()
              ? "Don't see it? Create a new entry →"
              : 'Skip search and create a new entry →'}
          </button>
        </>
      )}

      {step === 'create' && (
        <>
          <h1
            className="text-3xl mb-4"
            style={{ fontFamily: '"Playfair Display", serif', color: '#f0ede8' }}
          >
            New Entry
          </h1>

          <button
            onClick={() => setStep('search')}
            style={{
              background: 'none',
              border: 'none',
              color: '#8a8a96',
              cursor: 'pointer',
              fontSize: '14px',
              padding: 0,
              marginBottom: '24px',
              display: 'block',
            }}
          >
            ← Back to search
          </button>

          <AddMediaForm />
        </>
      )}
    </div>
  )
}
