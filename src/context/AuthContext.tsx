
"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseUser, signInWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import type { User } from '@/types';
import { Loader2 } from 'lucide-react';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<User | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // This effect's only job is to synchronize the Firebase Auth state with our app's state.
  // When the user first visits or refreshes, this will check if they are logged in.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        setIsLoading(true);
        if (fbUser) {
            setFirebaseUser(fbUser);
            // We now fetch the user profile from our own API to ensure it's in sync with the server session
             try {
                const res = await fetch('/api/auth/session');
                if (res.ok) {
                    const userData = await res.json();
                    setUser(userData);
                } else {
                     // If the server session doesn't exist, log out the client
                    await firebaseSignOut(auth);
                    setUser(null);
                }
            } catch (e) {
                console.error("AUTH CONTEXT: Error fetching user data on initial load", e);
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


  const signIn = useCallback(async (email: string, password: string): Promise<User | null> => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const idToken = await userCredential.user.getIdToken(true);
    
    // The server will create the session and return the full user profile
    const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error("AUTH CONTEXT: Session creation failed:", errorData);
        throw new Error(errorData.error || 'Failed to sign in');
    }

    const userData: User = await response.json();
    setUser(userData); // Update client-side state immediately
    return userData;
  }, []);

  const signOut = useCallback(async () => {
    try {
        await firebaseSignOut(auth);
        await fetch('/api/auth/session', { method: 'DELETE' });
    } catch (error) {
        console.error('Failed to sign out:', error);
    } finally {
      // A full reload on signout is the most reliable way to clear all state.
      window.location.href = '/login';
    }
  }, []);

  const value = { firebaseUser, user, isLoading, signIn, signOut };

  // While the initial auth state is loading, show a full-screen loader.
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
