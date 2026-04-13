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
