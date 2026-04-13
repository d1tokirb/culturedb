import { buildScoreDistribution, computeNewAggregate } from '@/lib/media'

describe('buildScoreDistribution', () => {
  it('builds an object with keys for every 0.5 increment from 1 to 10, all zeroed', () => {
    const dist = buildScoreDistribution()
    expect(dist['1']).toBe(0)
    expect(dist['5.5']).toBe(0)
    expect(dist['10']).toBe(0)
    expect(Object.keys(dist)).toHaveLength(19)
  })
})

describe('computeNewAggregate', () => {
  it('computes new average when adding a rating to an empty media', () => {
    const result = computeNewAggregate({ avg: 0, count: 0 }, 8.0, null)
    expect(result.avg).toBeCloseTo(8.0)
    expect(result.count).toBe(1)
  })

  it('updates average correctly when adding to existing ratings', () => {
    const result = computeNewAggregate({ avg: 8.0, count: 1 }, 6.0, null)
    expect(result.avg).toBeCloseTo(7.0)
    expect(result.count).toBe(2)
  })

  it('adjusts average when replacing a previous rating', () => {
    const result = computeNewAggregate({ avg: 7.0, count: 2 }, 10.0, 8.0)
    expect(result.avg).toBeCloseTo(8.0)
    expect(result.count).toBe(2)
  })
})
