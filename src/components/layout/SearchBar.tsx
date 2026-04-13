'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function SearchBar() {
  const [query, setQuery] = useState('')
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex-1 max-w-md">
      <input
        type="search"
        placeholder="Search films, games, music, people..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full py-2 px-4 rounded-full text-sm outline-none transition-all"
        style={{
          backgroundColor: '#161618',
          border: '1px solid #2a2a2e',
          color: '#f0ede8',
        }}
        onFocus={e => (e.currentTarget.style.borderColor = '#e8a027')}
        onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2e')}
      />
    </form>
  )
}
