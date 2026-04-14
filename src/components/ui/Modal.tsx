'use client'

import { useEffect } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  title: string
}

export function Modal({ open, onClose, children, title }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6"
        style={{ backgroundColor: '#161618', border: '1px solid #2a2a2e' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2
            className="text-xl"
            style={{ fontFamily: '"Playfair Display", serif', color: '#f0ede8' }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-2xl leading-none transition-colors"
            style={{ color: '#8a8a96' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#f0ede8')}
            onMouseLeave={e => (e.currentTarget.style.color = '#8a8a96')}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
