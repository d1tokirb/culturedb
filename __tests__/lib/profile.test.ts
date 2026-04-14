import { groupRatingsByCategory, buildCategoryAffinityData } from '@/lib/profile'
import type { Rating, Media } from '@/types'

const makeRating = (mediaId: string, score: number): Rating => ({
  id: `r-${mediaId}`,
  user_id: 'u1',
  media_id: mediaId,
  sub_id: null,
  score,
  review_text: '',
  status: 'completed',
  progress_detail: '',
  created_at: 0,
  updated_at: 0,
})

const makeMedia = (id: string, type: Media['type'], title: string): Media => ({
  id, title, type, description: '', poster_url: '',
  created_by: 'u1', created_at: 0, metadata: {},
  avg_score: 0, rating_count: 0, score_distribution: {},
})

describe('groupRatingsByCategory', () => {
  it('groups ratings by media type, sorted by score descending', () => {
    const ratings = [makeRating('m1', 8.0), makeRating('m2', 9.5), makeRating('m3', 7.0)]
    const mediaMap: Record<string, Media> = {
      m1: makeMedia('m1', 'movie', 'Movie A'),
      m2: makeMedia('m2', 'movie', 'Movie B'),
      m3: makeMedia('m3', 'show', 'Show A'),
    }
    const result = groupRatingsByCategory(ratings, mediaMap)
    expect(result.movie).toHaveLength(2)
    expect(result.movie![0].score).toBe(9.5)
    expect(result.show).toHaveLength(1)
  })
})

describe('buildCategoryAffinityData', () => {
  it('returns avg score per category', () => {
    const ratings = [makeRating('m1', 8.0), makeRating('m2', 6.0), makeRating('m3', 9.0)]
    const mediaMap: Record<string, Media> = {
      m1: makeMedia('m1', 'movie', 'Movie A'),
      m2: makeMedia('m2', 'movie', 'Movie B'),
      m3: makeMedia('m3', 'game', 'Game A'),
    }
    const result = buildCategoryAffinityData(ratings, mediaMap)
    const movie = result.find((d) => d.category === 'movie')
    const game = result.find((d) => d.category === 'game')
    expect(movie?.avg).toBeCloseTo(7.0)
    expect(game?.avg).toBeCloseTo(9.0)
  })
})
