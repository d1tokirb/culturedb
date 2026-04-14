import { render, screen, fireEvent } from '@testing-library/react'
import { RatingModal } from '@/components/media/RatingModal'
import type { Media } from '@/types'

const mockMedia: Media = {
  id: 'media-1',
  title: 'Breaking Bad',
  type: 'show',
  description: '',
  poster_url: '',
  created_by: 'user-1',
  created_at: 0,
  metadata: {},
  avg_score: 9.5,
  rating_count: 100,
  score_distribution: {},
}

it('renders the score input and status selector', () => {
  render(
    <RatingModal open={true} onClose={jest.fn()} media={mockMedia} onSubmit={jest.fn()} />
  )
  expect(screen.getByLabelText('Score')).toBeInTheDocument()
  expect(screen.getByLabelText('Status')).toBeInTheDocument()
})

it('calls onSubmit with score and status when submitted', () => {
  const onSubmit = jest.fn()
  render(
    <RatingModal open={true} onClose={jest.fn()} media={mockMedia} onSubmit={onSubmit} />
  )
  fireEvent.change(screen.getByLabelText('Score'), { target: { value: '8.5' } })
  fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'completed' } })
  fireEvent.click(screen.getByRole('button', { name: /submit rating/i }))
  expect(onSubmit).toHaveBeenCalledWith(
    expect.objectContaining({ score: 8.5, status: 'completed' })
  )
})
