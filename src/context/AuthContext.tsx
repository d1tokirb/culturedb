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
