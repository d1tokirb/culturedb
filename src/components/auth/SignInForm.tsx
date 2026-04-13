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
  const [loading, setLoading] = useState(false)

  const handleGoogle = async () => {
    setLoading(true)
    try {
      const result = await signInWithGoogle()
      const doc = await getUserDoc(result.user.uid)
      router.push(doc ? '/' : '/auth/onboarding')
    } catch (e: any) {
      setError(e.message)
      setLoading(false)
    }
  }

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const fn = isSignUp ? signUpWithEmail : signInWithEmail
      const result = await fn(email, password)
      const doc = await getUserDoc(result.user.uid)
      router.push(doc ? '/' : '/auth/onboarding')
    } catch (e: any) {
      setError(e.message)
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      <button
        onClick={handleGoogle}
        disabled={loading}
        className="w-full py-3 px-4 rounded-lg border flex items-center justify-center gap-3 text-sm font-medium transition-colors disabled:opacity-50"
        style={{ borderColor: '#2a2a2e', backgroundColor: '#161618', color: '#f0ede8' }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = '#e8a027')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = '#2a2a2e')}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
          <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A9.009 9.009 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.962L3.964 6.294C4.672 4.167 6.656 3.58 9 3.58z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </button>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px" style={{ backgroundColor: '#2a2a2e' }} />
        <span className="text-xs" style={{ color: '#8a8a96' }}>or</span>
        <div className="flex-1 h-px" style={{ backgroundColor: '#2a2a2e' }} />
      </div>

      <form onSubmit={handleEmail} className="flex flex-col gap-3">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full py-3 px-4 rounded-lg text-sm outline-none transition-all"
          style={{
            backgroundColor: '#161618',
            border: '1px solid #2a2a2e',
            color: '#f0ede8',
          }}
          onFocus={e => (e.currentTarget.style.borderColor = '#e8a027')}
          onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2e')}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full py-3 px-4 rounded-lg text-sm outline-none transition-all"
          style={{
            backgroundColor: '#161618',
            border: '1px solid #2a2a2e',
            color: '#f0ede8',
          }}
          onFocus={e => (e.currentTarget.style.borderColor = '#e8a027')}
          onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2e')}
        />
        {error && (
          <p className="text-xs px-1" style={{ color: '#e05252' }}>{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
          style={{ backgroundColor: '#e8a027', color: '#0c0c0e' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f0b035')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#e8a027')}
        >
          {loading ? '...' : isSignUp ? 'Create Account' : 'Sign In'}
        </button>
      </form>

      <button
        onClick={() => setIsSignUp(!isSignUp)}
        className="text-xs text-center transition-colors"
        style={{ color: '#8a8a96' }}
        onMouseEnter={e => (e.currentTarget.style.color = '#e8a027')}
        onMouseLeave={e => (e.currentTarget.style.color = '#8a8a96')}
      >
        {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
      </button>
    </div>
  )
}
