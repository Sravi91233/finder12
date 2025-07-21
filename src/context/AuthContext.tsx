
"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseUser, signInWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import type { User } from '@/types';
import { logger } from '@/lib/logger';

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
        logger.debug("AUTH CONTEXT: onAuthStateChanged triggered.", { hasUser: !!fbUser });
        setFirebaseUser(fbUser);
        if (fbUser) {
            // User is signed in according to Firebase client SDK.
            // Let's verify the session with our backend and get the full user profile.
            // This ensures client and server state are in sync.
            try {
                const response = await fetch('/api/auth/session', {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });
                if (response.ok) {
                    const userData: User = await response.json();
                    logger.debug("AUTH CONTEXT: Session verified on load, user set.", { email: userData.email });
                    setUser(userData);
                } else {
                    // Session is invalid or expired on the server.
                    logger.warn("AUTH CONTEXT: onAuthStateChanged user exists, but server session is invalid. Signing out.");
                    setUser(null);
                    await firebaseSignOut(auth); // Clean up client state
                }
            } catch (error) {
                logger.error("AUTH CONTEXT: Error verifying session on load.", error);
                setUser(null);
            }
        } else {
            // User is signed out.
            setUser(null);
        }
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password:string): Promise<User | null> => {
    logger.debug("AUTH CONTEXT: Attempting to sign in with email and password...");
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const idToken = await userCredential.user.getIdToken(true);
    
    logger.debug("AUTH CONTEXT: ID Token obtained. Posting to /api/auth/session...");
    const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
        logger.error("AUTH CONTEXT: Session creation failed!", await response.text());
        throw new Error('Failed to create session.');
    }

    const userData: User = await response.json();
    logger.debug("AUTH CONTEXT: Session created successfully. User data received:", userData);
    setUser(userData);
    return userData;
  }, []);

  const signOut = useCallback(async () => {
    logger.debug("AUTH CONTEXT: Signing out...");
    try {
        // 1. Tell the server to delete the session cookie
        await fetch('/api/auth/session', { method: 'DELETE' });
        // 2. Sign out from Firebase on the client
        await firebaseSignOut(auth);
    } catch (error) {
        logger.error('AUTH CONTEXT: Failed to sign out:', error);
    } finally {
      // 3. Clear local state
      setUser(null);
      setFirebaseUser(null);
      logger.debug("AUTH CONTEXT: Client user state cleared.");
    }
  }, []);

  const value = { firebaseUser, user, isLoading, signIn, signOut };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
