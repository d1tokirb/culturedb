import { generateInviteCode, aggregateMemberRatings } from '@/lib/groups'
import type { Rating } from '@/types'

describe('generateInviteCode', () => {
  it('returns a string of 8 alphanumeric characters', () => {
    const code = generateInviteCode()
    expect(typeof code).toBe('string')
    expect(code).toHaveLength(8)
    expect(/^[a-z0-9]+$/.test(code)).toBe(true)
  })

  it('generates different codes each call', () => {
    const a = generateInviteCode()
    const b = generateInviteCode()
    expect(a).not.toBe(b)
  })
})

describe('aggregateMemberRatings', () => {
  it('computes avg and distribution from multiple member ratings', () => {
    const ratings: Rating[] = [
      { id: '1', user_id: 'u1', media_id: 'm1', sub_id: null, score: 8.0, review_text: '', status: 'completed', progress_detail: '', created_at: 0, updated_at: 0 },
      { id: '2', user_id: 'u2', media_id: 'm1', sub_id: null, score: 6.0, review_text: '', status: 'completed', progress_detail: '', created_at: 0, updated_at: 0 },
    ]
    const result = aggregateMemberRatings(ratings)
    expect(result.avg).toBeCloseTo(7.0)
    expect(result.count).toBe(2)
    expect(result.distribution['8']).toBe(1)
    expect(result.distribution['6']).toBe(1)
  })

  it('returns zeros for empty ratings array', () => {
    const result = aggregateMemberRatings([])
    expect(result.avg).toBe(0)
    expect(result.count).toBe(0)
  })
})
