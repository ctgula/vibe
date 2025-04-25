'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Menu, User, Home, Grid, Settings, LayoutGrid, Bell, Star } from 'lucide-react';
import { useAuth } from '@/hooks/auth'; // Use AuthProvider context for all guest/user state and logout logic
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
import { motion } from 'framer-motion';

export function NavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, isLoading: authLoading, signOut } = useAuth(); // Use context-driven signOut for logout
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Determine if user is authenticated (either as regular user or guest)
  const isAuthenticated = !!user;
  const isGuest = !user;

  // Get user display name and avatar
  const displayName = profile?.display_name || 
                     user?.user_metadata?.full_name || 
                     user?.email?.split('@')[0] || 
                     'User';
  
  const avatarUrl = profile?.avatar_url || 
                   user?.user_metadata?.avatar_url || 
                   '';

  // Initial of the display name for avatar fallback
  const initials = displayName?.substring(0, 2).toUpperCase() || 'U';

  const handleLogout = async () => {
    // Use context-driven logout for both user and guest
    await signOut();
    // Clear any redirection flags to prevent loops
    sessionStorage.removeItem('justLoggedIn');
    // Redirect to home page
    // @ts-ignore - Next.js types are not fully compatible with the router
    router.push('/');
  };

  const handleProfileClick = () => {
    if (isGuest) {
      // For guest users, show a prompt to create a full account
      // @ts-ignore - Next.js types are not fully compatible with the router
      router.push('/auth/signup?fromGuest=true');
    } else {
      // For regular users, navigate to profile page
      // @ts-ignore - Next.js types are not fully compatible with the router
      router.push('/profile');
    }
    setIsMenuOpen(false);
  };

  const handleNavigation = (path: string) => {
    // @ts-ignore - Next.js types are not fully compatible with the router
    router.push(path);
    setIsMenuOpen(false);
  };

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // Hide navbar on certain pages
  if (pathname === '/' && !isAuthenticated) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/90 to-black/60 backdrop-blur-xl border-b border-zinc-800/20">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Logo />
          
          {isClient && (
            <div className="flex items-center gap-3">
              <motion.button 
                className="rounded-full px-4 py-2 text-sm font-medium text-white bg-zinc-800/80 hover:bg-zinc-700/90 transition-all"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  // @ts-ignore - Next.js types are not fully compatible with the router
                  router.push('/auth/login');
                }}
              >
                Log in
              </motion.button>
              <motion.button 
                className="rounded-full px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/20"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  // @ts-ignore - Next.js types are not fully compatible with the router
                  router.push('/auth/signup');
                }}
              >
                Sign Up
              </motion.button>
            </div>
          )}
        </div>
      </nav>
    );
  }

  if (!isClient) {
    return null; // Don't render anything on the server to prevent hydration errors
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/90 to-black/60 backdrop-blur-xl border-b border-zinc-800/20">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <Logo onClick={() => {
            // @ts-ignore - Next.js types are not fully compatible with the router
            router.push('/');
          }} />
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <div className="hidden sm:flex items-center space-x-1">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`p-2 rounded-full ${pathname === '/' ? 'bg-zinc-800/60 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'}`}
                  onClick={() => handleNavigation('/')}
                  title="Home"
                >
                  <Home className="h-5 w-5" />
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`p-2 rounded-full ${pathname === '/directory' ? 'bg-zinc-800/60 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'}`}
                  onClick={() => handleNavigation('/directory')}
                  title="Rooms"
                >
                  <LayoutGrid className="h-5 w-5" />
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`p-2 rounded-full ${pathname === '/favorites' ? 'bg-zinc-800/60 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'}`}
                  onClick={() => handleNavigation('/favorites')}
                  title="Favorites"
                >
                  <Star className="h-5 w-5" />
                </motion.button>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.button
                    className="rounded-full overflow-hidden border-2 border-transparent hover:border-indigo-500/50 transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={avatarUrl} />
                      <AvatarFallback className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </motion.button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-zinc-900 border border-zinc-800">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="rounded-full overflow-hidden">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={avatarUrl} />
                        <AvatarFallback className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm truncate max-w-[180px]">{displayName}</span>
                      <span className="text-xs text-zinc-400">{isGuest ? 'Guest User' : 'Member'}</span>
                    </div>
                  </div>
                  <DropdownMenuSeparator className="bg-zinc-800/50" />
                  <DropdownMenuItem 
                    className="cursor-pointer focus:bg-zinc-800 focus:text-white"
                    onClick={handleProfileClick}
                  >
                    <User className="mr-2 h-4 w-4" />
                    <span>{isGuest ? "Create Full Account" : "Profile"}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="cursor-pointer focus:bg-zinc-800 focus:text-white"
                    onClick={() => {
                      // @ts-ignore - Next.js types are not fully compatible with the router
                      router.push('/settings');
                    }}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-zinc-800/50" />
                  <DropdownMenuItem 
                    className="cursor-pointer focus:bg-red-950 text-red-400 focus:text-red-300"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{isGuest ? 'Exit Guest Mode' : 'Sign Out'}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <motion.button 
                className="rounded-full px-4 py-2 text-sm font-medium text-white bg-zinc-800/80 hover:bg-zinc-700/90 transition-all"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  // @ts-ignore - Next.js types are not fully compatible with the router
                  router.push('/auth/login');
                }}
              >
                Log in
              </motion.button>
              <motion.button 
                className="rounded-full px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/20"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  // @ts-ignore - Next.js types are not fully compatible with the router
                  router.push('/auth/signup');
                }}
              >
                Sign Up
              </motion.button>
            </div>
          )}
          <button
            className="inline-flex items-center justify-center p-2 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white sm:hidden"
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
                <motion.button 
                  className={`w-full text-left p-3 rounded-xl ${pathname === '/' ? 'bg-zinc-800 text-white' : 'text-zinc-300'} flex items-center`}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleNavigation('/')}
                >
                  <Home className="h-4 w-4 mr-3" />
                  Home
                </motion.button>
                <motion.button 
                  className={`w-full text-left p-3 rounded-xl ${pathname === '/directory' ? 'bg-zinc-800 text-white' : 'text-zinc-300'} flex items-center`}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleNavigation('/directory')}
                >
                  <LayoutGrid className="h-4 w-4 mr-3" />
                  Rooms
                </motion.button>
                <motion.button 
                  className={`w-full text-left p-3 rounded-xl ${pathname === '/favorites' ? 'bg-zinc-800 text-white' : 'text-zinc-300'} flex items-center`}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleNavigation('/favorites')}
                >
                  <Star className="h-4 w-4 mr-3" />
                  Favorites
                </motion.button>
                <motion.button 
                  className={`w-full text-left p-3 rounded-xl ${pathname === '/profile' ? 'bg-zinc-800 text-white' : 'text-zinc-300'} flex items-center`}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleProfileClick}
                >
                  <User className="h-4 w-4 mr-3" />
                  {isGuest ? "Create Full Account" : "Profile"}
                </motion.button>
                <motion.button 
                  className={`w-full text-left p-3 rounded-xl ${pathname === '/settings' ? 'bg-zinc-800 text-white' : 'text-zinc-300'} flex items-center`}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleNavigation('/settings')}
                >
                  <Settings className="h-4 w-4 mr-3" />
                  Settings
                </motion.button>
                <motion.button 
                  className="w-full text-left p-3 rounded-xl text-red-400 flex items-center"
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  {isGuest ? 'Exit Guest Mode' : 'Sign Out'}
                </motion.button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
