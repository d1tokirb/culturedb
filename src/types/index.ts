export type MediaType = 'show' | 'movie' | 'game' | 'album' | 'song' | 'person'

export type WatchStatus = 'want_to_watch' | 'in_progress' | 'completed'

export interface Episode {
  ep_num: number
  title: string
}

export interface Season {
  season_num: number
  episodes: Episode[]
}

export interface MediaMetadata {
  seasons?: Season[]
  songs?: string[]
  filmography?: string[]
  release_year?: number
  director?: string
  studio?: string
  creator?: string
  artist?: string
  album_id?: string
  platform?: string
  genre?: string
  role?: 'actor' | 'director' | 'artist'
}

export interface ScoreDistribution {
  [bucket: string]: number
}

export interface Media {
  id: string
  title: string
  type: MediaType
  description: string
  poster_url: string
  created_by: string
  created_at: number
  metadata: MediaMetadata
  avg_score: number
  rating_count: number
  score_distribution: ScoreDistribution
}

export interface Rating {
  id: string
  user_id: string
  media_id: string
  sub_id: string | null
  score: number
  review_text: string
  status: WatchStatus
  progress_detail: string
  created_at: number
  updated_at: number
}

export interface WatchlistEntry {
  user_id: string
  media_id: string
  status: WatchStatus
  progress_detail: string
  updated_at: number
}

export interface User {
  uid: string
  username: string
  avatar_url: string
  bio: string
  created_at: number
  groups: string[]
  following: string[]
}

export interface Group {
  id: string
  name: string
  created_by: string
  members: string[]
  invite_code: string
  created_at: number
}
