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
    <nav
      className="sticky top-0 z-50 px-4 py-3"
      style={{
        backgroundColor: 'rgba(12,12,14,0.92)',
        borderBottom: '1px solid #2a2a2e',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="max-w-5xl mx-auto flex items-center gap-4">
        <Link
          href="/"
          className="shrink-0 text-xl"
          style={{ fontFamily: '"Playfair Display", serif', color: '#f0ede8' }}
        >
          CultureDB
        </Link>

        <SearchBar />

        <div className="flex items-center gap-3 shrink-0">
          {firebaseUser ? (
            <>
              <Link
                href="/add"
                className="py-1.5 px-4 rounded-full text-xs font-semibold transition-colors"
                style={{ backgroundColor: '#e8a027', color: '#0c0c0e' }}
                onMouseEnter={(e: any) => (e.currentTarget.style.backgroundColor = '#f0b035')}
                onMouseLeave={(e: any) => (e.currentTarget.style.backgroundColor = '#e8a027')}
              >
                + Add
              </Link>
              <Link
                href={userDoc ? `/profile/${userDoc.username}` : '/auth/onboarding'}
                className="text-sm transition-colors"
                style={{ color: '#8a8a96' }}
                onMouseEnter={(e: any) => (e.currentTarget.style.color = '#f0ede8')}
                onMouseLeave={(e: any) => (e.currentTarget.style.color = '#8a8a96')}
              >
                {userDoc?.username ?? 'Profile'}
              </Link>
              <button
                onClick={handleSignOut}
                className="text-xs transition-colors"
                style={{ color: '#8a8a96' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#f0ede8')}
                onMouseLeave={e => (e.currentTarget.style.color = '#8a8a96')}
              >
                Out
              </button>
            </>
          ) : (
            <Link
              href="/auth/signin"
              className="py-1.5 px-4 rounded-full text-xs font-semibold transition-colors"
              style={{ backgroundColor: '#e8a027', color: '#0c0c0e' }}
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
