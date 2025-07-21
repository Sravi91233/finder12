
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser, signInWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
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

// Function to fetch the session cookie
async function fetchSessionCookie(user: FirebaseUser) {
    const idToken = await user.getIdToken();
    try {
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
    } catch (error) {
        console.error('Session cookie error:', error);
    }
}

// Function to clear the session cookie
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
  const router = useRouter();
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
          await fetchSessionCookie(fbUser);
          
          // Redirect after successful login, if not already on a protected page
          if (pathname === '/login' || pathname === '/signup') {
              router.push('/influencer-finder');
          }
        } else {
          // If user exists in Firebase Auth but not in Firestore, sign them out.
          setUser(null); 
          await firebaseSignOut(auth);
        }
      } else {
        setFirebaseUser(null);
        setUser(null);
        await clearSessionCookie(); // Clear session cookie on logout

        // If logged out, redirect to login page if they are on a protected route
        const protectedRoutes = ['/influencer-finder', '/dashboard'];
        const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
        if (isProtectedRoute) {
            router.push('/login');
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [pathname, router]);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
    // The onAuthStateChanged listener will handle the redirect.
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    // The onAuthStateChanged listener will handle clearing state and redirecting.
  };

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
