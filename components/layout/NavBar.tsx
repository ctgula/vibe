'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Menu, User, Home, Grid, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/use-supabase-auth';
import { useGuestSession } from '@/hooks/useGuestSession';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Logo } from '@/components/ui/logo';
import Image from 'next/image';

export function NavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, isLoading: authLoading, signOut, guestId } = useAuth();
  const { guestProfile, logout: logoutGuest } = useGuestSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Determine if user is authenticated (either as regular user or guest)
  const isAuthenticated = !!user || !!guestId;
  const isGuest = !user && !!guestId;

  // Get user display name and avatar
  const displayName = profile?.display_name || 
                     user?.user_metadata?.full_name || 
                     user?.email?.split('@')[0] || 
                     guestProfile?.name || 
                     'User';
  
  const avatarUrl = profile?.avatar_url || 
                   user?.user_metadata?.avatar_url || 
                   guestProfile?.avatar_url || 
                   '';

  // Initial of the display name for avatar fallback
  const initials = displayName?.substring(0, 2).toUpperCase() || 'U';

  const handleLogout = async () => {
    if (user) {
      // Log out regular user
      await signOut();
    } else if (guestId) {
      // Log out guest user
      logoutGuest();
    }
    
    // Clear any redirection flags to prevent loops
    sessionStorage.removeItem('justLoggedIn');
    
    // Redirect to home page
    router.push('/');
  };

  const handleProfileClick = () => {
    if (isGuest) {
      // For guest users, show a prompt to create a full account
      router.push('/auth/signup?fromGuest=true');
    } else {
      // For regular users, navigate to profile page
      router.push('/profile');
    }
    setIsMenuOpen(false);
  };

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // Hide navbar on certain pages
  if (pathname === '/' && !isAuthenticated) {
    return null;
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-zinc-900/90 to-zinc-900/80 backdrop-blur-sm border-b border-zinc-800/30">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          <Logo size="md" withText={true} />
        </Link>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full overflow-hidden border border-zinc-700/50 hover:border-zinc-500/70 transition-colors">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt={displayName}
                      width={40}
                      height={40}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <Avatar className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-purple-600">
                      <AvatarImage src={avatarUrl} alt={displayName} />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                  )}
                  <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-zinc-900"></span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-zinc-900 border border-zinc-800">
                <div className="flex flex-col space-y-1 p-2">
                  <p className="text-sm font-medium leading-none text-zinc-200">{displayName}</p>
                  <p className="text-xs leading-none text-zinc-500">{user?.email || isGuest ? "Guest User" : ""}</p>
                </div>
                <DropdownMenuSeparator className="bg-zinc-800" />
                <DropdownMenuItem 
                  className="cursor-pointer focus:bg-zinc-800 focus:text-zinc-100"
                  onClick={handleProfileClick}
                >
                  <User className="h-4 w-4 mr-2" />
                  {isGuest ? "Create Full Account" : "Profile"}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  asChild
                  className="cursor-pointer focus:bg-zinc-800 focus:text-zinc-100"
                >
                  <Link href="/settings" className="flex items-center w-full">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-zinc-800" />
                <DropdownMenuItem 
                  className="text-red-500 focus:text-red-500 focus:bg-zinc-800 cursor-pointer"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {isGuest ? 'Exit Guest Mode' : 'Sign Out'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/auth/login"
                className="rounded-md px-3 py-1.5 text-sm font-medium text-white bg-zinc-800/80 hover:bg-zinc-700/90 transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/auth/signup"
                className="rounded-md px-3 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition-colors shadow-lg shadow-indigo-500/20"
              >
                Sign Up
              </Link>
            </div>
          )}
          <button
            className="ml-4 inline-flex items-center justify-center p-2 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white sm:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>
      
      {/* Mobile menu, show/hide based on menu state */}
      {isMenuOpen && (
        <div className="sm:hidden bg-zinc-900/95 backdrop-blur-md border-b border-zinc-800">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {isAuthenticated && (
              <>
                <Link href="/">
                  <Button 
                    variant={pathname === '/' ? 'default' : 'ghost'} 
                    size="sm"
                    className="w-full justify-start"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Home
                  </Button>
                </Link>
                <Link href="/directory">
                  <Button 
                    variant={pathname === '/directory' ? 'default' : 'ghost'} 
                    size="sm"
                    className="w-full justify-start"
                  >
                    <Grid className="h-4 w-4 mr-2" />
                    Rooms
                  </Button>
                </Link>
                <Button 
                  variant={pathname === '/profile' ? 'default' : 'ghost'} 
                  size="sm"
                  className="w-full justify-start"
                  onClick={handleProfileClick}
                >
                  <User className="h-4 w-4 mr-2" />
                  {isGuest ? "Create Full Account" : "Profile"}
                </Button>
                <Link href="/settings">
                  <Button 
                    variant={pathname === '/settings' ? 'default' : 'ghost'} 
                    size="sm"
                    className="w-full justify-start"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="w-full justify-start text-red-500"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {isGuest ? 'Exit Guest Mode' : 'Sign Out'}
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
