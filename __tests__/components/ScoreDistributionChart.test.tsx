import { render, screen } from '@testing-library/react'
import { ScoreDistributionChart } from '@/components/media/ScoreDistributionChart'
import type { ScoreDistribution } from '@/types'

// Mock recharts to avoid canvas errors in jsdom
jest.mock('recharts', () => ({
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  Cell: () => null,
}))

const mockDist: ScoreDistribution = {
  '1': 0, '1.5': 0, '2': 0, '2.5': 0, '3': 0, '3.5': 0,
  '4': 0, '4.5': 0, '5': 2, '5.5': 0, '6': 3, '6.5': 0,
  '7': 5, '7.5': 0, '8': 8, '8.5': 0, '9': 4, '9.5': 0, '10': 1,
}

it('renders the avg score and rating count', () => {
  render(<ScoreDistributionChart distribution={mockDist} avgScore={7.8} ratingCount={23} />)
  expect(screen.getByText('7.8')).toBeInTheDocument()
  expect(screen.getByText('23 ratings')).toBeInTheDocument()
})
