'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import type { Media, WatchStatus } from '@/types'

interface SubmitPayload {
  score: number
  status: WatchStatus
  reviewText: string
  progressDetail: string
}

interface Props {
  open: boolean
  onClose: () => void
  media: Media
  initialScore?: number
  initialStatus?: WatchStatus
  onSubmit: (payload: SubmitPayload) => void | Promise<void>
}

const inputStyle = {
  backgroundColor: '#0c0c0e',
  border: '1px solid #2a2a2e',
  color: '#f0ede8',
  width: '100%',
  padding: '10px 12px',
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

export function RatingModal({
  open,
  onClose,
  media,
  initialScore,
  initialStatus = 'completed',
  onSubmit,
}: Props) {
  const [score, setScore] = useState(String(initialScore ?? ''))
  const [status, setStatus] = useState<WatchStatus>(initialStatus)
  const [reviewText, setReviewText] = useState('')
  const [progressDetail, setProgressDetail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const parsed = parseFloat(score)
    if (isNaN(parsed) || parsed < 1 || parsed > 10) {
      setError('Score must be between 1 and 10')
      return
    }
    setError('')
    setLoading(true)
    await onSubmit({ score: parsed, status, reviewText, progressDetail })
    setLoading(false)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={`Rate: ${media.title}`}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label htmlFor="score" style={labelStyle}>Score</label>
          <input
            id="score"
            type="number"
            min="1"
            max="10"
            step="0.1"
            placeholder="1.0 – 10.0"
            value={score}
            onChange={(e) => setScore(e.target.value)}
            required
            style={inputStyle}
            onFocus={e => (e.currentTarget.style.borderColor = '#e8a027')}
            onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2e')}
          />
        </div>

        <div>
          <label htmlFor="status" style={labelStyle}>Status</label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as WatchStatus)}
            style={inputStyle}
            onFocus={e => (e.currentTarget.style.borderColor = '#e8a027')}
            onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2e')}
          >
            <option value="completed">Completed</option>
            <option value="in_progress">In Progress</option>
            <option value="want_to_watch">Want to Watch</option>
          </select>
        </div>

        {status === 'in_progress' && (
          <div>
            <label style={labelStyle}>Progress</label>
            <input
              type="text"
              placeholder="e.g. S2E4 or Chapter 5"
              value={progressDetail}
              onChange={(e) => setProgressDetail(e.target.value)}
              style={inputStyle}
              onFocus={e => (e.currentTarget.style.borderColor = '#e8a027')}
              onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2e')}
            />
          </div>
        )}

        <div>
          <label style={labelStyle}>Review <span style={{ color: '#2a2a2e' }}>— optional</span></label>
          <textarea
            rows={3}
            placeholder="Your thoughts..."
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            style={{ ...inputStyle, resize: 'none' }}
            onFocus={e => (e.currentTarget.style.borderColor = '#e8a027')}
            onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2e')}
          />
        </div>

        {error && <p style={{ color: '#e05252', fontSize: '12px' }}>{error}</p>}

        <button
          type="submit"
          disabled={loading}
          style={{
            backgroundColor: '#e8a027',
            color: '#0c0c0e',
            padding: '12px',
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '14px',
            border: 'none',
            cursor: 'pointer',
            opacity: loading ? 0.5 : 1,
          }}
        >
          {loading ? 'Submitting...' : 'Submit Rating'}
        </button>
      </form>
    </Modal>
  )
}
