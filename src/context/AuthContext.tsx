
"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseUser, signInWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import type { User } from '@/types';
import { Loader2 } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setIsLoading(true);
      if (fbUser) {
        setFirebaseUser(fbUser);
        try {
          const res = await fetch('/api/user');
          if (res.ok) {
            const userData = await res.json();
            setUser(userData);
          } else {
            // This can happen if the cookie isn't set yet or is invalid.
            // The sign-in flow will handle fetching the user.
            setUser(null);
          }
        } catch (e) {
            console.error("Failed to fetch user data on load", e);
            setUser(null);
        }
      } else {
        setFirebaseUser(null);
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);


  const signIn = useCallback(async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const idToken = await userCredential.user.getIdToken(true);
    
    // Create the server-side session
    const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error("Session cookie creation failed:", errorData);
        throw new Error(errorData.error || 'Failed to set session cookie');
    }

    // Now that the session is created, fetch user data to update context
    try {
        const res = await fetch('/api/user');
        if (res.ok) {
            const userData = await res.json();
            setUser(userData);
        } else {
            throw new Error('Could not fetch user data after sign in');
        }
    } catch (e) {
        console.error("Failed to fetch user data after sign in", e);
        // Sign out to clean up state if user data fetch fails
        await firebaseSignOut(auth);
        throw e;
    }

  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    try {
        await fetch('/api/auth/session', { method: 'DELETE' });
    } catch (error) {
        console.error('Failed to clear session cookie:', error);
    }
    // A full reload on signout is the most reliable way to clear all state.
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
