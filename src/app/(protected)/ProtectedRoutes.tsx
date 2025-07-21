
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoutes({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // If the auth state is not loading and there is no user, redirect to login.
        if (!isLoading && !user) {
            console.log("PROTECTED ROUTES: No user found, redirecting to /login.");
            router.push('/login');
        }
    }, [user, isLoading, router]);

    // While the auth state is loading, show a loader.
    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
    // If a user is found, render the protected content.
    if (user) {
        return <>{children}</>;
    }

    // If no user and not loading (i.e., during the redirect), render nothing to avoid a flash of content.
    return null;
}
