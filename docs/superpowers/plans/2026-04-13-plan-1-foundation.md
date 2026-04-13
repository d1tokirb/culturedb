# Media Rater — Plan 1: Foundation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the core loop — users can sign in, add media entries, rate them (1–10 with decimals), and see score distribution bar graphs on media pages and the home page.

**Architecture:** Next.js App Router frontend with Firebase Auth (Google + email), Firestore for data, and Firebase Storage for poster uploads. Rating aggregates (avg, distribution) are stored denormalized on each media document and updated via Firestore transactions to avoid expensive reads.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Firebase 10, Tailwind CSS, Recharts (bar graphs), React Hook Form, Zod

---

## File Map

```
media-rater/
├── src/
│   ├── app/
│   │   ├── layout.tsx                    # Root layout, AuthProvider wrapper
│   │   ├── page.tsx                      # Home / Discover
│   │   ├── auth/
│   │   │   ├── signin/page.tsx           # Sign in page
│   │   │   └── onboarding/page.tsx       # Username setup after first sign-in
│   │   ├── media/
│   │   │   └── [id]/page.tsx             # Media detail page
│   │   ├── add/page.tsx                  # Add new media
│   │   └── search/page.tsx               # Search results
│   ├── components/
│   │   ├── auth/
│   │   │   ├── SignInForm.tsx
│   │   │   └── OnboardingForm.tsx
│   │   ├── media/
│   │   │   ├── MediaCard.tsx             # Card shown in discover feed
│   │   │   ├── AddMediaForm.tsx          # Dynamic form per media type
│   │   │   ├── RatingModal.tsx           # Score input + status selector
│   │   │   └── ScoreDistributionChart.tsx # Bar graph component
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   └── SearchBar.tsx
│   │   └── ui/
│   │       └── Modal.tsx                 # Reusable modal wrapper
│   ├── lib/
│   │   ├── firebase.ts                   # Firebase app init + exports
│   │   ├── auth.ts                       # Auth helpers (signIn, signOut, etc.)
│   │   ├── media.ts                      # Media CRUD + search
│   │   └── ratings.ts                    # Rating write + aggregate update
│   ├── context/
│   │   └── AuthContext.tsx               # useAuth hook + provider
│   └── types/
│       └── index.ts                      # All shared TypeScript types
├── .env.local                            # Firebase config vars
├── jest.config.ts
├── jest.setup.ts
└── __tests__/
    ├── lib/
    │   ├── ratings.test.ts
    │   └── media.test.ts
    └── components/
        ├── RatingModal.test.tsx
        └── ScoreDistributionChart.test.tsx
```

---

## Task 1: Project Bootstrap

**Files:**
- Create: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `jest.config.ts`, `jest.setup.ts`
- Create: `.env.local`

- [ ] **Step 1: Scaffold Next.js project**

```bash
cd /Users/ditokirb/Dev
npx create-next-app@latest media-rater \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-git
cd media-rater
```

- [ ] **Step 2: Install dependencies**

```bash
npm install firebase recharts react-hook-form zod @hookform/resolvers
npm install -D jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event ts-jest @types/jest
```

- [ ] **Step 3: Create jest.config.ts**

```typescript
// jest.config.ts
import type { Config } from 'jest'

const config: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: { jsx: 'react-jsx' } }],
  },
  testPathPattern: '__tests__',
}

export default config
```

- [ ] **Step 4: Create jest.setup.ts**

```typescript
// jest.setup.ts
import '@testing-library/jest-dom'
```

- [ ] **Step 5: Create .env.local**

Go to [Firebase Console](https://console.firebase.google.com), create a project named `media-rater`, enable Firestore, Firebase Auth (Google + email/password providers), and Firebase Storage. Then:

```bash
# .env.local
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

- [ ] **Step 6: Verify dev server starts**

```bash
npm run dev
```
Expected: Server running at http://localhost:3000 with default Next.js page.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: bootstrap Next.js project with Firebase and Recharts"
```

---

## Task 2: TypeScript Types

**Files:**
- Create: `src/types/index.ts`

- [ ] **Step 1: Write the types**

```typescript
// src/types/index.ts

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
  // show
  seasons?: Season[]
  // album
  songs?: string[] // song media IDs
  // person
  filmography?: string[] // media IDs
  // shared
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
  [bucket: string]: number // keys: "1", "1.5", "2", ..., "10"
}

export interface Media {
  id: string
  title: string
  type: MediaType
  description: string
  poster_url: string
  created_by: string // user uid
  created_at: number // unix ms
  metadata: MediaMetadata
  avg_score: number
  rating_count: number
  score_distribution: ScoreDistribution
}

export interface Rating {
  id: string
  user_id: string
  media_id: string
  sub_id: string | null // season/episode/song id, null for top-level
  score: number // 1.0–10.0
  review_text: string
  status: WatchStatus
  progress_detail: string // e.g. "S2E4"
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
```

- [ ] **Step 2: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add shared TypeScript types"
```

---

## Task 3: Firebase Config

**Files:**
- Create: `src/lib/firebase.ts`

- [ ] **Step 1: Write firebase.ts**

```typescript
// src/lib/firebase.ts
import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/firebase.ts
git commit -m "feat: add Firebase app initialization"
```

---

## Task 4: Auth Helpers

**Files:**
- Create: `src/lib/auth.ts`
- Create: `src/context/AuthContext.tsx`

- [ ] **Step 1: Write auth.ts**

```typescript
// src/lib/auth.ts
import {
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from './firebase'
import type { User } from '@/types'

export const signInWithGoogle = () =>
  signInWithPopup(auth, new GoogleAuthProvider())

export const signInWithEmail = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password)

export const signUpWithEmail = (email: string, password: string) =>
  createUserWithEmailAndPassword(auth, email, password)

export const signOut = () => firebaseSignOut(auth)

export const getUserDoc = async (uid: string): Promise<User | null> => {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? (snap.data() as User) : null
}

export const createUserDoc = async (uid: string, data: Omit<User, 'uid'>) =>
  setDoc(doc(db, 'users', uid), { uid, ...data })

export const subscribeToAuthState = (
  callback: (user: FirebaseUser | null) => void
) => onAuthStateChanged(auth, callback)
```

- [ ] **Step 2: Write AuthContext.tsx**

```typescript
// src/context/AuthContext.tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User as FirebaseUser } from 'firebase/auth'
import { subscribeToAuthState, getUserDoc } from '@/lib/auth'
import type { User } from '@/types'

interface AuthContextValue {
  firebaseUser: FirebaseUser | null
  userDoc: User | null
  loading: boolean
}

const AuthContext = createContext<AuthContextValue>({
  firebaseUser: null,
  userDoc: null,
  loading: true,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [userDoc, setUserDoc] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = subscribeToAuthState(async (fbUser) => {
      setFirebaseUser(fbUser)
      if (fbUser) {
        const doc = await getUserDoc(fbUser.uid)
        setUserDoc(doc)
      } else {
        setUserDoc(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  return (
    <AuthContext.Provider value={{ firebaseUser, userDoc, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
```

- [ ] **Step 3: Wrap root layout with AuthProvider**

```typescript
// src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/context/AuthContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Media Rater',
  description: 'Rate everything.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/auth.ts src/context/AuthContext.tsx src/app/layout.tsx
git commit -m "feat: add auth helpers and AuthContext provider"
```

---

## Task 5: Sign In Page

**Files:**
- Create: `src/components/auth/SignInForm.tsx`
- Create: `src/app/auth/signin/page.tsx`

- [ ] **Step 1: Write SignInForm.tsx**

```typescript
// src/components/auth/SignInForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signInWithGoogle, signInWithEmail, signUpWithEmail, getUserDoc } from '@/lib/auth'

export function SignInForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState('')

  const handleGoogle = async () => {
    try {
      const result = await signInWithGoogle()
      const doc = await getUserDoc(result.user.uid)
      router.push(doc ? '/' : '/auth/onboarding')
    } catch (e: any) {
      setError(e.message)
    }
  }

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const fn = isSignUp ? signUpWithEmail : signInWithEmail
      const result = await fn(email, password)
      const doc = await getUserDoc(result.user.uid)
      router.push(doc ? '/' : '/auth/onboarding')
    } catch (e: any) {
      setError(e.message)
    }
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-sm">
      <button
        onClick={handleGoogle}
        className="w-full py-2 px-4 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
      >
        Continue with Google
      </button>
      <div className="flex items-center gap-2 text-gray-400 text-sm">
        <div className="flex-1 h-px bg-gray-200" />
        or
        <div className="flex-1 h-px bg-gray-200" />
      </div>
      <form onSubmit={handleEmail} className="flex flex-col gap-3">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
        >
          {isSignUp ? 'Create Account' : 'Sign In'}
        </button>
      </form>
      <button
        onClick={() => setIsSignUp(!isSignUp)}
        className="text-sm text-blue-600 hover:underline"
      >
        {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Write signin page**

```typescript
// src/app/auth/signin/page.tsx
import { SignInForm } from '@/components/auth/SignInForm'

export default function SignInPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome</h1>
        <p className="text-gray-500 text-sm mb-6">Sign in to rate everything.</p>
        <SignInForm />
      </div>
    </main>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/auth/SignInForm.tsx src/app/auth/signin/page.tsx
git commit -m "feat: add sign in page with Google and email auth"
```

---

## Task 6: Onboarding Page

**Files:**
- Create: `src/components/auth/OnboardingForm.tsx`
- Create: `src/app/auth/onboarding/page.tsx`

- [ ] **Step 1: Write OnboardingForm.tsx**

```typescript
// src/components/auth/OnboardingForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { createUserDoc } from '@/lib/auth'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'

export function OnboardingForm() {
  const { firebaseUser } = useAuth()
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const checkUsernameAvailable = async (name: string) => {
    const q = query(collection(db, 'users'), where('username', '==', name))
    const snap = await getDocs(q)
    return snap.empty
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!firebaseUser) return
    setError('')
    setLoading(true)

    const trimmed = username.trim().toLowerCase()
    if (!/^[a-z0-9_]{3,20}$/.test(trimmed)) {
      setError('Username must be 3–20 characters: letters, numbers, underscores only')
      setLoading(false)
      return
    }

    const available = await checkUsernameAvailable(trimmed)
    if (!available) {
      setError('Username already taken')
      setLoading(false)
      return
    }

    await createUserDoc(firebaseUser.uid, {
      username: trimmed,
      avatar_url: firebaseUser.photoURL ?? '',
      bio: bio.trim(),
      created_at: Date.now(),
      groups: [],
      following: [],
    })

    router.push('/')
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
        <input
          type="text"
          placeholder="e.g. cool_person"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Bio (optional)</label>
        <textarea
          placeholder="Tell people what you're into"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
      >
        {loading ? 'Creating account...' : 'Get Started'}
      </button>
    </form>
  )
}
```

- [ ] **Step 2: Write onboarding page**

```typescript
// src/app/auth/onboarding/page.tsx
import { OnboardingForm } from '@/components/auth/OnboardingForm'

export default function OnboardingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">One last thing</h1>
        <p className="text-gray-500 text-sm mb-6">Pick a username to get started.</p>
        <OnboardingForm />
      </div>
    </main>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/auth/OnboardingForm.tsx src/app/auth/onboarding/page.tsx
git commit -m "feat: add onboarding page for username setup"
```

---

## Task 7: Navbar

**Files:**
- Create: `src/components/layout/Navbar.tsx`
- Create: `src/components/layout/SearchBar.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Write SearchBar.tsx**

```typescript
// src/components/layout/SearchBar.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function SearchBar() {
  const [query, setQuery] = useState('')
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex-1 max-w-md">
      <input
        type="search"
        placeholder="Search media, people..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full py-1.5 px-3 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </form>
  )
}
```

- [ ] **Step 2: Write Navbar.tsx**

```typescript
// src/components/layout/Navbar.tsx
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { signOut } from '@/lib/auth'
import { SearchBar } from './SearchBar'

export function Navbar() {
  const { firebaseUser, userDoc } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/auth/signin')
  }

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-5xl mx-auto flex items-center gap-4">
        <Link href="/" className="font-bold text-lg text-gray-900 shrink-0">
          MediaRater
        </Link>
        <SearchBar />
        <div className="flex items-center gap-3 shrink-0">
          {firebaseUser ? (
            <>
              <Link
                href="/add"
                className="py-1.5 px-3 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 transition"
              >
                + Add
              </Link>
              <Link
                href={userDoc ? `/profile/${userDoc.username}` : '/auth/onboarding'}
                className="text-sm text-gray-700 hover:text-gray-900"
              >
                {userDoc?.username ?? 'Profile'}
              </Link>
              <button
                onClick={handleSignOut}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/auth/signin"
              className="py-1.5 px-3 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 transition"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
```

- [ ] **Step 3: Add Navbar to root layout**

```typescript
// src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/context/AuthContext'
import { Navbar } from '@/components/layout/Navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Media Rater',
  description: 'Rate everything.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <Navbar />
          <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
        </AuthProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/ src/app/layout.tsx
git commit -m "feat: add navbar with search bar and auth state"
```

---

## Task 8: Media Library (Firestore CRUD)

**Files:**
- Create: `src/lib/media.ts`
- Create: `__tests__/lib/media.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/lib/media.test.ts
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
    // 2 ratings: 8.0 and 6.0 → avg 7.0. Replace first with 10.0 → (10+6)/2 = 8.0
    const result = computeNewAggregate({ avg: 7.0, count: 2 }, 10.0, 8.0)
    expect(result.avg).toBeCloseTo(8.0)
    expect(result.count).toBe(2)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest __tests__/lib/media.test.ts --no-coverage
```
Expected: FAIL — `buildScoreDistribution` and `computeNewAggregate` not found.

- [ ] **Step 3: Write media.ts**

```typescript
// src/lib/media.ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  runTransaction,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from './firebase'
import type { Media, MediaType, ScoreDistribution } from '@/types'

export function buildScoreDistribution(): ScoreDistribution {
  const dist: ScoreDistribution = {}
  for (let i = 1; i <= 10; i += 0.5) {
    dist[String(i)] = 0
  }
  return dist
}

export function computeNewAggregate(
  current: { avg: number; count: number },
  newScore: number,
  previousScore: number | null
): { avg: number; count: number } {
  if (previousScore !== null) {
    // Replace existing rating
    const totalWithout = current.avg * current.count - previousScore
    return {
      avg: (totalWithout + newScore) / current.count,
      count: current.count,
    }
  }
  // New rating
  const newCount = current.count + 1
  return {
    avg: (current.avg * current.count + newScore) / newCount,
    count: newCount,
  }
}

export async function getMedia(id: string): Promise<Media | null> {
  const snap = await getDoc(doc(db, 'media', id))
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Media) : null
}

export async function searchMedia(q: string, type?: MediaType): Promise<Media[]> {
  // Firestore doesn't support native full-text search.
  // We store a lowercase title for prefix matching.
  const lower = q.toLowerCase()
  let ref = query(
    collection(db, 'media'),
    where('title_lower', '>=', lower),
    where('title_lower', '<=', lower + '\uf8ff'),
    limit(20)
  )
  if (type) {
    ref = query(ref, where('type', '==', type))
  }
  const snap = await getDocs(ref)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Media))
}

export async function getRecentMedia(limitCount = 20): Promise<Media[]> {
  const snap = await getDocs(
    query(collection(db, 'media'), orderBy('created_at', 'desc'), limit(limitCount))
  )
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Media))
}

export async function uploadPoster(file: File, mediaId: string): Promise<string> {
  const storageRef = ref(storage, `posters/${mediaId}/${file.name}`)
  await uploadBytes(storageRef, file)
  return getDownloadURL(storageRef)
}

export async function createMedia(
  data: Omit<Media, 'id' | 'avg_score' | 'rating_count' | 'score_distribution'>,
  posterFile?: File
): Promise<string> {
  const docRef = await addDoc(collection(db, 'media'), {
    ...data,
    title_lower: data.title.toLowerCase(),
    avg_score: 0,
    rating_count: 0,
    score_distribution: buildScoreDistribution(),
  })

  if (posterFile) {
    const url = await uploadPoster(posterFile, docRef.id)
    await runTransaction(db, async (tx) => {
      tx.update(doc(db, 'media', docRef.id), { poster_url: url })
    })
  }

  return docRef.id
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest __tests__/lib/media.test.ts --no-coverage
```
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/media.ts __tests__/lib/media.test.ts
git commit -m "feat: add media Firestore CRUD and aggregate helpers"
```

---

## Task 9: Ratings Library

**Files:**
- Create: `src/lib/ratings.ts`
- Create: `__tests__/lib/ratings.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/lib/ratings.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest __tests__/lib/ratings.test.ts --no-coverage
```
Expected: FAIL — `scoreToDistributionKey` not found.

- [ ] **Step 3: Write ratings.ts**

```typescript
// src/lib/ratings.ts
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  query,
  where,
  getDocs,
  runTransaction,
} from 'firebase/firestore'
import { db } from './firebase'
import { computeNewAggregate } from './media'
import type { Rating, WatchStatus } from '@/types'

export function scoreToDistributionKey(score: number): string {
  const rounded = Math.round(score * 2) / 2
  const clamped = Math.min(10, Math.max(1, rounded))
  return String(clamped)
}

export async function getUserRating(
  userId: string,
  mediaId: string,
  subId: string | null = null
): Promise<Rating | null> {
  const q = query(
    collection(db, 'ratings'),
    where('user_id', '==', userId),
    where('media_id', '==', mediaId),
    where('sub_id', '==', subId)
  )
  const snap = await getDocs(q)
  if (snap.empty) return null
  const d = snap.docs[0]
  return { id: d.id, ...d.data() } as Rating
}

export async function submitRating({
  userId,
  mediaId,
  subId = null,
  score,
  reviewText = '',
  status,
  progressDetail = '',
}: {
  userId: string
  mediaId: string
  subId?: string | null
  score: number
  reviewText?: string
  status: WatchStatus
  progressDetail?: string
}): Promise<void> {
  const existing = await getUserRating(userId, mediaId, subId)
  const now = Date.now()
  const bucket = scoreToDistributionKey(score)

  await runTransaction(db, async (tx) => {
    const mediaRef = doc(db, 'media', mediaId)
    const mediaSnap = await tx.get(mediaRef)
    if (!mediaSnap.exists()) throw new Error('Media not found')

    const mediaData = mediaSnap.data()
    const { avg, count } = computeNewAggregate(
      { avg: mediaData.avg_score, count: mediaData.rating_count },
      score,
      existing?.score ?? null
    )

    // Update score distribution
    const dist = { ...mediaData.score_distribution }
    if (existing) {
      const oldBucket = scoreToDistributionKey(existing.score)
      dist[oldBucket] = Math.max(0, (dist[oldBucket] ?? 0) - 1)
    }
    dist[bucket] = (dist[bucket] ?? 0) + 1

    tx.update(mediaRef, {
      avg_score: avg,
      rating_count: count,
      score_distribution: dist,
    })

    if (existing) {
      tx.update(doc(db, 'ratings', existing.id), {
        score,
        review_text: reviewText,
        status,
        progress_detail: progressDetail,
        updated_at: now,
      })
    } else {
      // addDoc can't be used inside transactions — use a new doc ref
      const newRatingRef = doc(collection(db, 'ratings'))
      tx.set(newRatingRef, {
        user_id: userId,
        media_id: mediaId,
        sub_id: subId,
        score,
        review_text: reviewText,
        status,
        progress_detail: progressDetail,
        created_at: now,
        updated_at: now,
      })
    }
  })
}

export async function getMediaRatings(mediaId: string): Promise<Rating[]> {
  const snap = await getDocs(
    query(collection(db, 'ratings'), where('media_id', '==', mediaId), where('sub_id', '==', null))
  )
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Rating))
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest __tests__/lib/ratings.test.ts --no-coverage
```
Expected: PASS (1 test, 5 assertions).

- [ ] **Step 5: Commit**

```bash
git add src/lib/ratings.ts __tests__/lib/ratings.test.ts
git commit -m "feat: add ratings library with transaction-based aggregate update"
```

---

## Task 10: Score Distribution Chart

**Files:**
- Create: `src/components/media/ScoreDistributionChart.tsx`
- Create: `__tests__/components/ScoreDistributionChart.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/components/ScoreDistributionChart.test.tsx
import { render, screen } from '@testing-library/react'
import { ScoreDistributionChart } from '@/components/media/ScoreDistributionChart'
import type { ScoreDistribution } from '@/types'

const mockDist: ScoreDistribution = {
  '1': 0, '1.5': 0, '2': 0, '2.5': 0, '3': 0, '3.5': 0,
  '4': 0, '4.5': 0, '5': 2, '5.5': 0, '6': 3, '6.5': 0,
  '7': 5, '7.5': 0, '8': 8, '8.5': 0, '9': 4, '9.5': 0, '10': 1,
}

it('renders without crashing with a valid distribution', () => {
  render(<ScoreDistributionChart distribution={mockDist} avgScore={7.8} ratingCount={23} />)
  expect(screen.getByText('7.8')).toBeInTheDocument()
  expect(screen.getByText('23 ratings')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest __tests__/components/ScoreDistributionChart.test.tsx --no-coverage
```
Expected: FAIL — module not found.

- [ ] **Step 3: Write ScoreDistributionChart.tsx**

```typescript
// src/components/media/ScoreDistributionChart.tsx
'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { ScoreDistribution } from '@/types'

interface Props {
  distribution: ScoreDistribution
  avgScore: number
  ratingCount: number
}

export function ScoreDistributionChart({ distribution, avgScore, ratingCount }: Props) {
  const data = Object.entries(distribution)
    .sort(([a], [b]) => parseFloat(a) - parseFloat(b))
    .map(([score, count]) => ({ score, count }))

  return (
    <div className="w-full">
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-4xl font-bold text-gray-900">{avgScore.toFixed(1)}</span>
        <span className="text-gray-500 text-sm">{ratingCount} ratings</span>
      </div>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <XAxis
            dataKey="score"
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              return (
                <div className="bg-white border border-gray-200 rounded px-2 py-1 text-xs shadow">
                  Score {payload[0].payload.score}: {payload[0].value} ratings
                </div>
              )
            }}
          />
          <Bar dataKey="count" radius={[2, 2, 0, 0]}>
            {data.map((entry) => (
              <Cell
                key={entry.score}
                fill={parseFloat(entry.score) >= avgScore ? '#3b82f6' : '#93c5fd'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest __tests__/components/ScoreDistributionChart.test.tsx --no-coverage
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/media/ScoreDistributionChart.tsx __tests__/components/ScoreDistributionChart.test.tsx
git commit -m "feat: add score distribution bar chart component"
```

---

## Task 11: Rating Modal

**Files:**
- Create: `src/components/ui/Modal.tsx`
- Create: `src/components/media/RatingModal.tsx`
- Create: `__tests__/components/RatingModal.test.tsx`

- [ ] **Step 1: Write Modal.tsx**

```typescript
// src/components/ui/Modal.tsx
'use client'

import { useEffect } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  title: string
}

export function Modal({ open, onClose, children, title }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Write the failing test for RatingModal**

```typescript
// __tests__/components/RatingModal.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { RatingModal } from '@/components/media/RatingModal'

const mockMedia = {
  id: 'media-1',
  title: 'Breaking Bad',
  type: 'show' as const,
  description: '',
  poster_url: '',
  created_by: 'user-1',
  created_at: 0,
  metadata: {},
  avg_score: 9.5,
  rating_count: 100,
  score_distribution: {},
}

it('renders the score input and status selector', () => {
  render(
    <RatingModal
      open={true}
      onClose={jest.fn()}
      media={mockMedia}
      onSubmit={jest.fn()}
    />
  )
  expect(screen.getByLabelText('Score')).toBeInTheDocument()
  expect(screen.getByLabelText('Status')).toBeInTheDocument()
})

it('calls onSubmit with score and status when submitted', () => {
  const onSubmit = jest.fn()
  render(
    <RatingModal
      open={true}
      onClose={jest.fn()}
      media={mockMedia}
      onSubmit={onSubmit}
    />
  )
  fireEvent.change(screen.getByLabelText('Score'), { target: { value: '8.5' } })
  fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'completed' } })
  fireEvent.click(screen.getByRole('button', { name: /submit rating/i }))
  expect(onSubmit).toHaveBeenCalledWith(
    expect.objectContaining({ score: 8.5, status: 'completed' })
  )
})
```

- [ ] **Step 3: Run test to verify it fails**

```bash
npx jest __tests__/components/RatingModal.test.tsx --no-coverage
```
Expected: FAIL — module not found.

- [ ] **Step 4: Write RatingModal.tsx**

```typescript
// src/components/media/RatingModal.tsx
'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import type { Media, WatchStatus } from '@/types'

interface SubmitPayload {
  score: number
  status: WatchStatus
  reviewText: string
  progressDetail: string
}

interface Props {
  open: boolean
  onClose: () => void
  media: Media
  initialScore?: number
  initialStatus?: WatchStatus
  onSubmit: (payload: SubmitPayload) => void | Promise<void>
}

export function RatingModal({
  open,
  onClose,
  media,
  initialScore,
  initialStatus = 'completed',
  onSubmit,
}: Props) {
  const [score, setScore] = useState(String(initialScore ?? ''))
  const [status, setStatus] = useState<WatchStatus>(initialStatus)
  const [reviewText, setReviewText] = useState('')
  const [progressDetail, setProgressDetail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const parsed = parseFloat(score)
    if (isNaN(parsed) || parsed < 1 || parsed > 10) {
      setError('Score must be between 1 and 10')
      return
    }
    setError('')
    setLoading(true)
    await onSubmit({ score: parsed, status, reviewText, progressDetail })
    setLoading(false)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={`Rate: ${media.title}`}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="score" className="block text-sm font-medium text-gray-700 mb-1">
            Score
          </label>
          <input
            id="score"
            type="number"
            min="1"
            max="10"
            step="0.1"
            placeholder="e.g. 8.5"
            value={score}
            onChange={(e) => setScore(e.target.value)}
            required
            className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as WatchStatus)}
            className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="completed">Completed</option>
            <option value="in_progress">In Progress</option>
            <option value="want_to_watch">Want to Watch</option>
          </select>
        </div>
        {status === 'in_progress' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Progress (optional)
            </label>
            <input
              type="text"
              placeholder="e.g. S2E4 or Chapter 5"
              value={progressDetail}
              onChange={(e) => setProgressDetail(e.target.value)}
              className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Review (optional)
          </label>
          <textarea
            rows={3}
            placeholder="Your thoughts..."
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? 'Submitting...' : 'Submit Rating'}
        </button>
      </form>
    </Modal>
  )
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npx jest __tests__/components/RatingModal.test.tsx --no-coverage
```
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/Modal.tsx src/components/media/RatingModal.tsx __tests__/components/RatingModal.test.tsx
git commit -m "feat: add rating modal with score input and status selector"
```

---

## Task 12: Add Media Form

**Files:**
- Create: `src/components/media/AddMediaForm.tsx`
- Create: `src/app/add/page.tsx`

- [ ] **Step 1: Write AddMediaForm.tsx**

```typescript
// src/components/media/AddMediaForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { createMedia } from '@/lib/media'
import type { MediaType } from '@/types'

const MEDIA_TYPES: { value: MediaType; label: string }[] = [
  { value: 'show', label: 'TV Show' },
  { value: 'movie', label: 'Movie' },
  { value: 'game', label: 'Game' },
  { value: 'album', label: 'Album' },
  { value: 'song', label: 'Song' },
  { value: 'person', label: 'Person (Actor/Director/Artist)' },
]

export function AddMediaForm() {
  const { firebaseUser } = useAuth()
  const router = useRouter()
  const [type, setType] = useState<MediaType>('show')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [posterFile, setPosterFile] = useState<File | null>(null)
  const [releaseYear, setReleaseYear] = useState('')
  const [genre, setGenre] = useState('')
  const [creator, setCreator] = useState('')
  const [artist, setArtist] = useState('')
  const [studio, setStudio] = useState('')
  const [platform, setPlatform] = useState('')
  const [role, setRole] = useState<'actor' | 'director' | 'artist'>('actor')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!firebaseUser) return
    setLoading(true)
    setError('')

    const metadata: Record<string, any> = {}
    if (releaseYear) metadata.release_year = parseInt(releaseYear)
    if (genre) metadata.genre = genre
    if (type === 'show') metadata.creator = creator
    if (type === 'movie') metadata.director = creator
    if (type === 'game') { metadata.studio = studio; metadata.platform = platform }
    if (type === 'album' || type === 'song') metadata.artist = artist
    if (type === 'person') metadata.role = role

    try {
      const id = await createMedia(
        {
          title,
          type,
          description,
          poster_url: '',
          created_by: firebaseUser.uid,
          created_at: Date.now(),
          metadata,
        },
        posterFile ?? undefined
      )
      router.push(`/media/${id}?rate=true`)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-w-lg">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as MediaType)}
          className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {MEDIA_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Poster Image (optional)</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setPosterFile(e.target.files?.[0] ?? null)}
          className="w-full text-sm text-gray-500"
        />
      </div>

      {(type === 'show' || type === 'movie') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {type === 'show' ? 'Creator' : 'Director'}
          </label>
          <input
            type="text"
            value={creator}
            onChange={(e) => setCreator(e.target.value)}
            className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {(type === 'album' || type === 'song') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Artist</label>
          <input
            type="text"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {type === 'game' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Studio</label>
            <input
              type="text"
              value={studio}
              onChange={(e) => setStudio(e.target.value)}
              className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
            <input
              type="text"
              placeholder="e.g. PC, PS5, Switch"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </>
      )}

      {type === 'person' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'actor' | 'director' | 'artist')}
            className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="actor">Actor</option>
            <option value="director">Director</option>
            <option value="artist">Artist</option>
          </select>
        </div>
      )}

      {type !== 'person' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Release Year</label>
          <input
            type="number"
            min="1900"
            max={new Date().getFullYear() + 2}
            value={releaseYear}
            onChange={(e) => setReleaseYear(e.target.value)}
            className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Genre (optional)</label>
        <input
          type="text"
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="py-2 px-6 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
      >
        {loading ? 'Creating...' : 'Create & Rate'}
      </button>
    </form>
  )
}
```

- [ ] **Step 2: Write /add page**

```typescript
// src/app/add/page.tsx
import { AddMediaForm } from '@/components/media/AddMediaForm'

export default function AddPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New Media</h1>
      <AddMediaForm />
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/media/AddMediaForm.tsx src/app/add/page.tsx
git commit -m "feat: add media creation form with dynamic fields per category"
```

---

## Task 13: Search Page

**Files:**
- Create: `src/components/media/MediaCard.tsx`
- Create: `src/app/search/page.tsx`

- [ ] **Step 1: Write MediaCard.tsx**

```typescript
// src/components/media/MediaCard.tsx
import Link from 'next/link'
import type { Media } from '@/types'

interface Props {
  media: Media
}

const TYPE_LABELS: Record<string, string> = {
  show: 'TV Show',
  movie: 'Movie',
  game: 'Game',
  album: 'Album',
  song: 'Song',
  person: 'Person',
}

export function MediaCard({ media }: Props) {
  return (
    <Link href={`/media/${media.id}`} className="group flex gap-3 items-start">
      <div className="w-14 h-20 bg-gray-100 rounded-lg overflow-hidden shrink-0">
        {media.poster_url ? (
          <img src={media.poster_url} alt={media.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
            No image
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 group-hover:text-blue-600 truncate">
          {media.title}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">{TYPE_LABELS[media.type]}</p>
        {media.rating_count > 0 ? (
          <p className="text-sm font-semibold text-blue-600 mt-1">
            {media.avg_score.toFixed(1)}{' '}
            <span className="text-xs font-normal text-gray-400">
              ({media.rating_count} ratings)
            </span>
          </p>
        ) : (
          <p className="text-xs text-gray-400 mt-1">No ratings yet</p>
        )}
      </div>
    </Link>
  )
}
```

- [ ] **Step 2: Write search page**

```typescript
// src/app/search/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { searchMedia } from '@/lib/media'
import { MediaCard } from '@/components/media/MediaCard'
import type { Media, MediaType } from '@/types'

const TYPES: { value: MediaType | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'show', label: 'Shows' },
  { value: 'movie', label: 'Movies' },
  { value: 'game', label: 'Games' },
  { value: 'album', label: 'Albums' },
  { value: 'song', label: 'Songs' },
  { value: 'person', label: 'People' },
]

export default function SearchPage() {
  const params = useSearchParams()
  const router = useRouter()
  const q = params.get('q') ?? ''
  const [results, setResults] = useState<Media[]>([])
  const [typeFilter, setTypeFilter] = useState<MediaType | ''>('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!q) return
    setLoading(true)
    searchMedia(q, typeFilter || undefined)
      .then(setResults)
      .finally(() => setLoading(false))
  }, [q, typeFilter])

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">
          Results for <span className="text-blue-600">"{q}"</span>
        </h1>
        <button
          onClick={() => router.push('/add')}
          className="text-sm text-blue-600 hover:underline"
        >
          + Add new entry
        </button>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => setTypeFilter(t.value as MediaType | '')}
            className={`py-1 px-3 rounded-full text-sm border transition ${
              typeFilter === t.value
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Searching...</p>
      ) : results.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-3">No results found for "{q}"</p>
          <button
            onClick={() => router.push('/add')}
            className="py-2 px-4 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            Create new entry
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {results.map((m) => (
            <MediaCard key={m.id} media={m} />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/media/MediaCard.tsx src/app/search/page.tsx
git commit -m "feat: add search page with category filters and MediaCard component"
```

---

## Task 14: Media Detail Page

**Files:**
- Create: `src/app/media/[id]/page.tsx`

- [ ] **Step 1: Write media detail page**

```typescript
// src/app/media/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { getMedia } from '@/lib/media'
import { submitRating, getUserRating } from '@/lib/ratings'
import { useAuth } from '@/context/AuthContext'
import { ScoreDistributionChart } from '@/components/media/ScoreDistributionChart'
import { RatingModal } from '@/components/media/RatingModal'
import type { Media, Rating } from '@/types'

const TYPE_LABELS: Record<string, string> = {
  show: 'TV Show', movie: 'Movie', game: 'Game',
  album: 'Album', song: 'Song', person: 'Person',
}

export default function MediaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const { firebaseUser } = useAuth()
  const [media, setMedia] = useState<Media | null>(null)
  const [userRating, setUserRating] = useState<Rating | null>(null)
  const [ratingOpen, setRatingOpen] = useState(searchParams.get('rate') === 'true')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMedia(id).then((m) => {
      setMedia(m)
      setLoading(false)
    })
  }, [id])

  useEffect(() => {
    if (firebaseUser && id) {
      getUserRating(firebaseUser.uid, id).then(setUserRating)
    }
  }, [firebaseUser, id])

  const handleSubmitRating = async (payload: {
    score: number
    status: import('@/types').WatchStatus
    reviewText: string
    progressDetail: string
  }) => {
    if (!firebaseUser || !media) return
    await submitRating({
      userId: firebaseUser.uid,
      mediaId: media.id,
      ...payload,
    })
    // Refresh media to get updated aggregates
    const updated = await getMedia(id)
    setMedia(updated)
    const updatedRating = await getUserRating(firebaseUser.uid, id)
    setUserRating(updatedRating)
  }

  if (loading) return <p className="text-gray-400 text-sm">Loading...</p>
  if (!media) return <p className="text-gray-500">Media not found.</p>

  return (
    <div className="max-w-3xl">
      <div className="flex gap-6 mb-8">
        {media.poster_url && (
          <img
            src={media.poster_url}
            alt={media.title}
            className="w-32 h-48 object-cover rounded-xl shrink-0"
          />
        )}
        <div className="flex-1">
          <p className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-1">
            {TYPE_LABELS[media.type]}
          </p>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{media.title}</h1>
          {media.description && (
            <p className="text-gray-600 text-sm mb-4">{media.description}</p>
          )}
          <div className="flex gap-3">
            {firebaseUser && (
              <button
                onClick={() => setRatingOpen(true)}
                className="py-2 px-4 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
              >
                {userRating ? `Your rating: ${userRating.score}` : 'Rate this'}
              </button>
            )}
          </div>
        </div>
      </div>

      {media.rating_count > 0 && (
        <div className="bg-gray-50 rounded-2xl p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Score Distribution</h2>
          <ScoreDistributionChart
            distribution={media.score_distribution}
            avgScore={media.avg_score}
            ratingCount={media.rating_count}
          />
        </div>
      )}

      {media && (
        <RatingModal
          open={ratingOpen}
          onClose={() => setRatingOpen(false)}
          media={media}
          initialScore={userRating?.score}
          initialStatus={userRating?.status}
          onSubmit={handleSubmitRating}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/media/
git commit -m "feat: add media detail page with score chart and rating modal"
```

---

## Task 15: Home / Discover Page

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Write home page**

```typescript
// src/app/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getRecentMedia } from '@/lib/media'
import { MediaCard } from '@/components/media/MediaCard'
import type { Media, MediaType } from '@/types'

const TYPES: { value: MediaType | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'show', label: 'Shows' },
  { value: 'movie', label: 'Movies' },
  { value: 'game', label: 'Games' },
  { value: 'album', label: 'Albums' },
  { value: 'song', label: 'Songs' },
  { value: 'person', label: 'People' },
]

export default function HomePage() {
  const [media, setMedia] = useState<Media[]>([])
  const [filter, setFilter] = useState<MediaType | ''>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getRecentMedia(40)
      .then((items) => {
        setMedia(filter ? items.filter((m) => m.type === filter) : items)
      })
      .finally(() => setLoading(false))
  }, [filter])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Discover</h1>
        <Link
          href="/add"
          className="py-1.5 px-4 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 transition"
        >
          + Add Media
        </Link>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => setFilter(t.value as MediaType | '')}
            className={`py-1 px-3 rounded-full text-sm border transition ${
              filter === t.value
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading...</p>
      ) : media.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 mb-4">Nothing here yet. Be the first to add something!</p>
          <Link
            href="/add"
            className="py-2 px-5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            Add Media
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {media.map((m) => (
            <MediaCard key={m.id} media={m} />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Run all tests**

```bash
npx jest --no-coverage
```
Expected: All tests PASS.

- [ ] **Step 3: Start dev server and verify manually**

```bash
npm run dev
```

Manually verify:
1. Home page loads at http://localhost:3000 with category filters
2. Sign in at /auth/signin with Google or email
3. New user gets redirected to /auth/onboarding
4. Navbar shows username after sign-in
5. Search bar navigates to /search?q=...
6. /add shows dynamic form that changes based on category selection
7. Creating a media entry redirects to /media/[id]?rate=true and opens rating modal
8. Submitting a rating updates the score and bar chart on the media page

- [ ] **Step 4: Final commit**

```bash
git add src/app/page.tsx
git commit -m "feat: add home discover page with category filters"
```

---

## Self-Review Checklist

- [x] **Spec coverage:** Auth (Google + email) ✓, add media (search + create) ✓, rating modal ✓, bar graph ✓, home page ✓, media pages ✓, category separation ✓, in-progress status ✓
- [x] **Placeholders:** None — all code blocks are complete
- [x] **Type consistency:** `Media`, `Rating`, `WatchStatus`, `ScoreDistribution` defined in Task 2 and used consistently throughout. `computeNewAggregate` defined in `media.ts` (Task 8) and imported in `ratings.ts` (Task 9). `scoreToDistributionKey` defined and used in same file.
- [x] **Not covered in this plan (Plan 2):** Profile pages, ranked lists, watchlist management UI, follow system
- [x] **Not covered in this plan (Plan 3):** Groups, group rating tabs, friend rating overlays
