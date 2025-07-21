
"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Icons } from "@/components/icons";
import {
  LayoutDashboard,
  Users,
  Search,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, firebaseUser } = useAuth();
  const router = useRouter();


  if (!firebaseUser || !user) {
    // The AuthProvider and middleware handle the loading state and redirects
    return null;
  }

  const navItems = [
    {
      href: "/influencer-finder",
      label: "Influencer Finder",
      icon: Search,
      roles: ["user", "admin"],
    },
    {
      href: "/dashboard/user",
      label: "User Dashboard",
      icon: LayoutDashboard,
      roles: ["user"],
    },
    {
      href: "/dashboard/admin",
      label: "Admin Dashboard",
      icon: Users,
      roles: ["admin"],
    },
  ];

  return (
    <div className="flex min-h-screen">
      <Sidebar navItems={navItems} userRole={user.role} />
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-muted/40">
          {children}
        </main>
      </div>
    </div>
  );
}

function Sidebar({ navItems, userRole }: { navItems: any[]; userRole: string }) {
  const pathname = usePathname();

  return (
    <nav className="hidden md:flex md:flex-col md:w-64 bg-background border-r">
      <div className="p-4 border-b">
        <Link href="/" className="flex items-center gap-2">
          <Icons.logo className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold">InfluenceFinder</span>
        </Link>
      </div>
      <div className="flex-1 p-4 space-y-2">
        {navItems.map((item) =>
          item.roles.includes(userRole) ? (
            <Link key={item.href} href={item.href}>
              <Button
                variant={pathname === item.href ? "secondary" : "ghost"}
                className="w-full justify-start"
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            </Link>
          ) : null
        )}
      </div>
    </nav>
  );
}

function Header() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Failed to sign out", error);
    }
  };

  if (!user || !user.name || !user.email) {
    return (
        <header className="flex h-16 items-center justify-end px-4 sm:px-6 lg:px-8 bg-background border-b" />
    )
  }

  return (
    <header className="flex h-16 items-center justify-end px-4 sm:px-6 lg:px-8 bg-background border-b">
        <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-auto justify-start gap-2 p-1">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={`https://avatar.vercel.sh/${user.email}.png`} alt={user.name} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                    <div className="hidden sm:flex sm:flex-col sm:items-start">
                    <span className="text-sm font-medium">{user.name}</span>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                </div>
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                    </p>
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/pricing')}>
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Billing</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
    </header>
  );
}
