# Media Rater Platform — Design Spec
**Date:** 2026-04-13  
**Status:** Approved

---

## Overview

A fully public media rating platform where users can rate, rank, and track shows, movies, games, music, and people (actors/directors). Ratings are user-submitted on a 1–10 decimal scale. All profiles and ratings are public. Friend groups provide filtered data views.

---

## Stack

- **Frontend + API:** Next.js (App Router)
- **Auth:** Firebase Auth — Google OAuth + email/password
- **Database:** Firestore (NoSQL)
- **Storage:** Firebase Storage — user-uploaded posters/avatars

---

## Data Model

### Collections

**`users`**
```
uid, username, avatar_url, bio, created_at,
groups: [group_id], following: [uid]
```

**`media`**
```
id, title, type (show|movie|game|album|song|person),
description, poster_url, created_by, created_at,
metadata: {
  // show: { seasons: [{season_num, episodes: [{ep_num, title}]}] }
  // album: { songs: [song_id] }
  // person: { filmography: [media_id] }
  // game/movie: { release_year, director, studio }
}
avg_score, rating_count,
score_distribution: { "1": 0, "1.5": 0, ..., "10": 0 }
```

**`ratings`**
```
id, user_id, media_id, sub_id (season/episode/song id or null),
score (1.0–10.0), review_text, status (completed|in_progress|want_to_watch),
progress_detail (e.g. "S2E4"), created_at, updated_at
```

**`watchlists`**
```
user_id, media_id, status (want_to_watch|in_progress|completed),
progress_detail, updated_at
```

**`groups`**
```
id, name, created_by, members: [uid], invite_code, created_at
```

### Aggregate Strategy
Rating averages and score distributions are stored directly on each media document and updated via Firestore transactions on every rating write. This prevents expensive full-collection reads on page load.

---

## Pages & Routes

### `/` — Home / Discover
- Recently rated/added media across all categories
- Bar graph: score distribution for trending items
- Search bar + "Add New" button if no results found
- Category filter tabs: All / Shows / Movies / Games / Music / People

### `/media/[id]` — Media Page
- Title, poster, description, category, metadata
- Overall score badge + bar graph (score distribution)
- Rate button → rating modal
- Watchlist / In Progress toggle
- **Tabs:**
  - All Ratings — full public distribution graph
  - Friend Ratings — scores from followed users
  - Group Ratings — per-group averages (only shown if user is in groups)
- For shows: season/episode list, each individually rateable
- For albums: song list, each individually rateable
- For persons: bio + filmography grid with per-work scores

### `/profile/[username]` — Public Profile
- Avatar, username, bio, groups
- Ranked lists by category (ordered by user's own score):
  - Top Shows / Top Movies / Top Games / Top Albums / Top Songs / Top People
- Category affinity stats (avg score per category, volume rated)
- Watchlist section: Want to Watch / In Progress / Completed

### `/add` — Add New Media
- Form: title, category selector, poster upload, description, metadata fields (dynamic per category)
- On submit: creates media doc, opens rating modal automatically

### `/groups/[id]` — Group Page
- Group name, members list
- Aggregate ratings from all members
- Group leaderboard: highest-rated items among members

### `/search` — Search
- Full-text search across media titles and usernames
- Filterable by category

---

## Rating & Entry Flow

1. User clicks rate on any media page
2. **Search first** — type title, results appear
3. If found → rating modal opens: score (1.0–10.0 input), optional review, status selector
4. If not found → "Create New" → `/add` form → on submit, rating modal opens automatically
5. Rating saved to `ratings` collection; media doc `avg_score`, `rating_count`, `score_distribution` updated via transaction

### Ranked Lists
- Auto-sorted by score descending per category on profile
- Manual reordering allowed within same-score tiers
- In Progress items excluded from ranked lists until marked complete

### In Progress
- Tracked in `watchlists` collection with `progress_detail` (e.g. "S3E7")
- Shown on profile in dedicated In Progress section
- Shown as a badge on media pages

---

## Bar Graphs

- Present on: home page (trending), every media page (default tab)
- X-axis: score buckets (1.0, 1.5, 2.0 … 10.0)
- Y-axis: number of ratings
- Submenu / tab variations:
  - Friend overlay: highlights scores from followed users
  - Group overlay: highlights scores from a selected group
- Profile page: category affinity chart (avg score per category as a bar)

---

## Auth & Social

### Sign In
- Google OAuth or email/password via Firebase Auth
- First sign-in triggers username setup screen (unique handle, avatar, bio)

### Groups
- Any user can create a named group
- Invite via shareable link or username search
- Groups are public (visible aggregate ratings), membership is invite-only
- "Group Ratings" tab on media pages appears when user is in at least one group

### Following
- Follow any public user
- "Friend Ratings" tab on media pages pulls from followed users
- No direct messaging

---

## Media Categories

| Category | Sub-ratings | Key Metadata |
|----------|-------------|--------------|
| Show | Seasons, Episodes | Creator, year, genre |
| Movie | None | Director, year, genre |
| Game | None | Studio, platform, year |
| Album | Songs | Artist, year, genre |
| Song | None | Artist, album |
| Person | Per-work (via filmography) | Role (actor/director/artist) |

---

## Out of Scope (v1)
- Private profiles or private ratings
- Direct messaging
- Notifications
- Mobile app (web only)
- External API imports (TMDB, IGDB, etc.)

---

## Name
TBD — to be decided by the team.
