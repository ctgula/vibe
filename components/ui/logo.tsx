'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  withText?: boolean;
  className?: string;
  onClick?: () => void;
}

export function Logo({ 
  size = 'md', 
  withText = true, 
  className = '',
  onClick
}: LogoProps) {
  const router = useRouter();
  
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-12'
  };
  
  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default behavior that could cause nested link issues
    if (onClick) {
      onClick();
    } else {
      router.push('/');
    }
  };
  
  return (
    <motion.div 
      className={`flex items-center space-x-2 cursor-pointer ${className}`} 
      onClick={handleClick}
      whileHover={{ scale: 1.05 }} 
      whileTap={{ scale: 0.95 }}
    >
      {/* Removed Image component entirely */}
      {/* You can add a placeholder SVG or simple text here if needed */}
      {/* Example: <div className={`w-8 h-8 bg-indigo-500 rounded ${sizeClasses[size]}`}></div> */}
      
      {withText && (
        <span className={`font-bold ${textSizes[size]} bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400`}>
          VIBE
        </span>
      )}
    </motion.div>
  );
}
