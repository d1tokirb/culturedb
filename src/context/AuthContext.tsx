'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User as FirebaseUser } from 'firebase/auth'
import { subscribeToAuthState, getUserDoc } from '@/lib/auth'
import type { User } from '@/types'

interface AuthContextValue {
  firebaseUser: FirebaseUser | null
  userDoc: User | null
  loading: boolean
  refreshUserDoc: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  firebaseUser: null,
  userDoc: null,
  loading: true,
  refreshUserDoc: async () => {},
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

  const refreshUserDoc = useCallback(async () => {
    if (!firebaseUser) return
    const doc = await getUserDoc(firebaseUser.uid)
    setUserDoc(doc)
  }, [firebaseUser])

  return (
    <AuthContext.Provider value={{ firebaseUser, userDoc, loading, refreshUserDoc }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
