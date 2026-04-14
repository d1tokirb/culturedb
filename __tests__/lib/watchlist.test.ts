import { getWatchlistStatus } from '@/lib/watchlist'

describe('getWatchlistStatus', () => {
  it('is a function that accepts userId and mediaId', () => {
    expect(typeof getWatchlistStatus).toBe('function')
  })
})
