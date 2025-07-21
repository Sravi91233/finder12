
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        setIsLoading(true);
        setFirebaseUser(fbUser);
        // We will rely on the session cookie and middleware to handle auth state.
        // For the client, we just need to know if a Firebase user exists.
        // The actual user profile will be fetched on pages/server actions as needed.
        setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);


  const signIn = useCallback(async (email: string, password: string): Promise<User | null> => {
    console.log("AUTH CONTEXT: Attempting to sign in with email and password...");
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const idToken = await userCredential.user.getIdToken(true);
    
    console.log("AUTH CONTEXT: ID Token obtained. Posting to /api/auth/session...");
    const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
        console.error("AUTH CONTEXT: Session creation failed!", await response.text());
        throw new Error('Failed to create session.');
    }

    const userData: User = await response.json();
    console.log("AUTH CONTEXT: Session created successfully. User data received:", userData);
    setUser(userData);
    return userData;
  }, []);

  const signOut = useCallback(async () => {
    console.log("AUTH CONTEXT: Signing out...");
    try {
        await firebaseSignOut(auth);
        await fetch('/api/auth/session', { method: 'DELETE' });
    } catch (error) {
        console.error('AUTH CONTEXT: Failed to sign out:', error);
    } finally {
      console.log("AUTH CONTEXT: Redirecting to /login after sign out.");
      window.location.href = '/login';
    }
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
