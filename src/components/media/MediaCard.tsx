import Link from 'next/link'
import type { Media } from '@/types'

interface Props {
  media: Media
}

const TYPE_LABELS: Record<string, string> = {
  show: 'TV Show', movie: 'Movie', game: 'Game',
  album: 'Album', song: 'Song', person: 'Person',
}

export function MediaCard({ media }: Props) {
  return (
    <Link
      href={`/media/${media.id}`}
      className="group flex gap-4 items-start rounded-xl p-3 transition-colors"
      style={{ backgroundColor: 'transparent' }}
      onMouseEnter={(e: any) => (e.currentTarget.style.backgroundColor = '#161618')}
      onMouseLeave={(e: any) => (e.currentTarget.style.backgroundColor = 'transparent')}
    >
      <div
        className="w-14 h-20 rounded-lg overflow-hidden shrink-0 flex items-center justify-center"
        style={{ backgroundColor: '#161618', border: '1px solid #2a2a2e' }}
      >
        {media.poster_url ? (
          <img src={media.poster_url} alt={media.title} className="w-full h-full object-cover" />
        ) : (
          <span style={{ color: '#2a2a2e', fontSize: '20px' }}>▪</span>
        )}
      </div>
      <div className="flex-1 min-w-0 pt-1">
        <p
          className="font-medium truncate mb-0.5 transition-colors"
          style={{ color: '#f0ede8' }}
        >
          {media.title}
        </p>
        <p className="text-xs mb-2" style={{ color: '#8a8a96' }}>
          {TYPE_LABELS[media.type]}
        </p>
        {media.rating_count > 0 ? (
          <p className="text-sm font-bold" style={{ color: '#e8a027' }}>
            {media.avg_score.toFixed(1)}{' '}
            <span className="text-xs font-normal" style={{ color: '#8a8a96' }}>
              ({media.rating_count})
            </span>
          </p>
        ) : (
          <p className="text-xs" style={{ color: '#3a3a3e' }}>No ratings yet</p>
        )}
      </div>
    </Link>
  )
}
