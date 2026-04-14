import Link from 'next/link'
import type { Rating, Media } from '@/types'

interface Props {
  items: (Rating & { media: Media })[]
  category: string
}

const CATEGORY_LABELS: Record<string, string> = {
  show: 'TV Shows', movie: 'Movies', game: 'Games',
  album: 'Albums', song: 'Songs', person: 'People',
}

export function RankedList({ items, category }: Props) {
  if (items.length === 0) return null

  return (
    <div>
      <p className="text-xs uppercase tracking-widest mb-4" style={{ color: '#8a8a96' }}>
        {CATEGORY_LABELS[category] ?? category}
      </p>
      <ol className="flex flex-col gap-3">
        {items.map((item, i) => (
          <li key={item.id} className="flex items-center gap-3">
            <span className="text-xs w-5 text-right shrink-0 tabular-nums" style={{ color: '#3a3a3e' }}>
              {i + 1}
            </span>
            {item.media.poster_url && (
              <img src={item.media.poster_url} alt={item.media.title}
                className="w-8 h-10 object-cover rounded shrink-0" />
            )}
            <Link
              href={`/media/${item.media_id}`}
              className="flex-1 text-sm truncate transition-colors"
              style={{ color: '#f0ede8' }}
              onMouseEnter={(e: any) => (e.currentTarget.style.color = '#e8a027')}
              onMouseLeave={(e: any) => (e.currentTarget.style.color = '#f0ede8')}
            >
              {item.media.title}
            </Link>
            <span className="text-sm font-bold shrink-0" style={{ color: '#e8a027' }}>
              {item.score.toFixed(1)}
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}
