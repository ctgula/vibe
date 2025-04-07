'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Bell, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationsPanel } from '@/components/NotificationsPanel';
import { useEnhancedNotifications } from '@/hooks/useEnhancedNotifications';

interface RoomHeaderProps {
  roomName: string;
  participantCount: number;
  onShowParticipants: () => void;
}

export function RoomHeader({ roomName, participantCount, onShowParticipants }: RoomHeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const { unreadCount } = useEnhancedNotifications();

  return (
    <div className="flex justify-between items-center p-4 bg-black/20 backdrop-blur-sm">
      <div className="flex items-center">
        <Link href="/directory">
          <Button variant="ghost" size="icon" className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-lg font-bold text-white">{roomName}</h1>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center"
          onClick={onShowParticipants}
        >
          <Users className="h-4 w-4 mr-1" />
          <span>{participantCount}</span>
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center relative"
          onClick={() => setShowNotifications(!showNotifications)}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-xs text-white rounded-full w-4 h-4 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </div>
      
      {/* Floating notifications panel */}
      {showNotifications && <NotificationsPanel autoShow={true} position="top-right" />}
    </div>
  );
}
