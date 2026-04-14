import { scoreToDistributionKey } from '@/lib/ratings'

describe('scoreToDistributionKey', () => {
  it('rounds a score to the nearest 0.5 bucket key', () => {
    expect(scoreToDistributionKey(8.0)).toBe('8')
    expect(scoreToDistributionKey(7.5)).toBe('7.5')
    expect(scoreToDistributionKey(9.3)).toBe('9.5')
    expect(scoreToDistributionKey(1.1)).toBe('1')
    expect(scoreToDistributionKey(10.0)).toBe('10')
  })
})
