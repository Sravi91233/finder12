
"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseUser, signInWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { User } from '@/types';
import { Loader2 } from 'lucide-react';
import { usePathname } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchSessionCookie(user: FirebaseUser) {
    const idToken = await user.getIdToken(true); // Force refresh
    const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
    });
    if (!response.ok) {
        const errorData = await response.json();
        console.error("Session cookie creation failed:", errorData);
        throw new Error('Failed to set session cookie');
    }
}

async function clearSessionCookie() {
    try {
        await fetch('/api/auth/session', { method: 'DELETE' });
    } catch (error) {
        console.error('Failed to clear session cookie:', error);
    }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setIsLoading(true);
      if (fbUser) {
        setFirebaseUser(fbUser);
        const userDocRef = doc(db, 'users', fbUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data() as User;
          setUser(userData);
          await setDoc(userDocRef, { lastLogin: serverTimestamp() }, { merge: true });
        } else {
          // This case handles if a user exists in Firebase Auth but not Firestore.
          setUser(null); 
          await firebaseSignOut(auth);
        }
      } else {
        setFirebaseUser(null);
        setUser(null);
        // Let middleware handle redirects, but clear the client-side state.
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [pathname]);

  const signIn = useCallback(async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    // Await the server-side session creation before allowing the client to proceed.
    await fetchSessionCookie(userCredential.user);
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    await clearSessionCookie();
    // Use full page reload to ensure state is cleared everywhere.
    window.location.href = '/login';
  }, []);

  const value = { firebaseUser, user, isLoading, signIn, signOut };

  if (isLoading) {
    return (
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    )
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
