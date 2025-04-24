'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface UserProfileLinkProps {
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  profileId?: string;
  themeColor?: string;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  className?: string;
}

export function UserProfileLink({
  username,
  displayName,
  avatarUrl,
  profileId,
  themeColor = '#6366f1',
  size = 'md',
  showName = false,
  className,
}: UserProfileLinkProps) {
  const router = useRouter();
  
  const dimensions = {
    sm: { avatar: 'w-8 h-8', text: 'text-sm' },
    md: { avatar: 'w-10 h-10', text: 'text-base' },
    lg: { avatar: 'w-12 h-12', text: 'text-lg' },
  };
  
  const initials = displayName ? displayName.charAt(0).toUpperCase() : username ? username.charAt(0).toUpperCase() : '?';
  
  const handleClick = () => {
    // Navigate to profile page
    router.push('/profile');
  };
  
  return (
    <div 
      className={cn(
        "flex items-center gap-2 cursor-pointer transition-opacity hover:opacity-80", 
        className
      )}
      onClick={handleClick}
    >
      <div className={cn("relative rounded-full flex-shrink-0", dimensions[size].avatar)}>
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={displayName || username || "User"}
            width={size === 'lg' ? 48 : size === 'md' ? 40 : 32}
            height={size === 'lg' ? 48 : size === 'md' ? 40 : 32}
            className="rounded-full object-cover w-full h-full"
          />
        ) : (
          <div 
            className="w-full h-full rounded-full flex items-center justify-center text-white font-medium"
            style={{ backgroundColor: themeColor }}
          >
            {initials}
          </div>
        )}
      </div>
      
      {showName && (displayName || username) && (
        <div className={cn("flex flex-col", dimensions[size].text)}>
          {displayName && <span className="font-medium text-white leading-tight">{displayName}</span>}
          {username && <span className="text-zinc-400 text-xs">@{username}</span>}
        </div>
      )}
    </div>
  );
}
